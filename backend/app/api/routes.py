from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
import shutil
import pathlib

from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import StreamingResponse

from app.google.gmail_api import build_gmail_service, send_email
from app.google.oauth import get_oauth_credentials
from app.pollers.gmail_poller import GmailPoller
from app.google.calendar_api import (
    build_calendar_service,
    get_free_busy,
    find_free_slots,
    draft_negotiation_email,
)
from app.agents.transcription import transcribe
from app.agents.extraction import extract_from_transcript
from app.langgraph.graph import run_graph
from app.core.config import SCHEDULE_MIN_SLOT_MINUTES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

# =========================
# HELPERS
# =========================

async def _ensure_poller(request: Request):
    """Ensures Gmail poller is initialized in app state."""
    try:
        poller = getattr(request.app.state, "gmail_poller", None)
        if poller:
            return poller, None

        creds = await asyncio.to_thread(get_oauth_credentials)
        gmail_service = await asyncio.to_thread(build_gmail_service, creds)

        poller = GmailPoller(gmail_service)
        request.app.state.gmail_poller = poller

        return poller, None
    except Exception as e:
        logger.exception("Poller initialization failed")
        return None, str(e)

# =========================
# BASIC & HEALTH
# =========================

@router.get("/health")
async def health():
    return {"status": "ok", "message": "Backend is healthy 🚀"}

@router.get("/hello")
async def hello():
    return {"message": "Hello from backend 🚀"}

# =========================
# INBOX
# =========================

@router.get("/inbox/unread")
async def unread(request: Request):
    poller, err = await _ensure_poller(request)
    if not poller:
        return {"error": f"Gmail Poller Error: {err}", "emails": [], "count": 0}

    try:
        state = poller.get_last_state()
        # Ensure consistency: Frontend expects emails array and count
        if not state:
            return {"emails": [], "count": 0, "lastPollEpoch": None}
        return state
    except Exception as e:
        logger.error(f"Inbox fetch error: {e}")
        return {"error": str(e), "emails": [], "count": 0}

# =========================
# PIPELINE
# =========================

@router.post("/pipeline")
async def run_pipeline(request: Request):
    try:
        poller, err = await _ensure_poller(request)
        if not poller:
            return {"error": err, "emails": [], "freeSlots": [], "draftEmail": None}

        # 1. Get New Emails
        messages = []
        try:
            messages = await poller.poll_once()
        except Exception:
            logger.exception("Email polling failed")

        # 2. Get Calendar Slots
        slots = []
        try:
            creds = await asyncio.to_thread(get_oauth_credentials)
            calendar_service = await asyncio.to_thread(build_calendar_service, creds)
            busy = await asyncio.to_thread(get_free_busy, calendar_service)
            slots = find_free_slots(busy, duration_minutes=SCHEDULE_MIN_SLOT_MINUTES)
        except Exception:
            logger.exception("Calendar slot fetching failed")

        # 3. Draft Generation Logic
        email_draft = ""
        if messages and slots:
            try:
                first = messages[0]
                # Safe extraction of recipient and subject
                recipient = first.get("from", "there").split("<")[0].strip()
                subject = first.get("subject", "Meeting Follow-up")
                email_draft = draft_negotiation_email(slots, recipient, subject)
            except Exception:
                logger.exception("Draft generation failed")
                email_draft = "AI could not generate a draft from your current slots."
        else:
            email_draft = "No new emails or free slots found to generate a draft."

        return {
            "emails": messages,
            "freeSlots": slots,
            "draftEmail": email_draft
        }

    except Exception as e:
        logger.exception("Pipeline execution failed")
        return {"error": str(e), "emails": [], "freeSlots": [], "draftEmail": None}

# =========================
# SEND EMAIL
# =========================

@router.post("/send")
async def send_email_endpoint(payload: dict):
    try:
        to = payload.get("to")
        subject = payload.get("subject", "No Subject")
        body = payload.get("body")

        if not to or not body:
            return {"error": "Recipient (to) and body are required", "status": "failed"}

        creds = await asyncio.to_thread(get_oauth_credentials)
        gmail_service = await asyncio.to_thread(build_gmail_service, creds)

        result = await asyncio.to_thread(send_email, gmail_service, to, subject, body)
        return {"success": True, "status": "success", "result": result}

    except Exception as e:
        logger.exception("Send email endpoint failed")
        return {"error": str(e), "status": "error"}

# =========================
# TRANSCRIBE & AUDIO
# =========================

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = pathlib.Path(file.filename or "upload.wav").suffix
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Execute transcription
        transcript = await asyncio.to_thread(transcribe, tmp_path)
        
        if not transcript or "Error" in str(transcript):
            return {"transcript": "", "error": str(transcript) or "Transcription failed"}
            
        return {"transcript": str(transcript).strip()}
        
    except Exception as e:
        logger.exception("Transcription failed")
        return {"transcript": "", "error": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

# =========================
# EXTRACT DATA
# =========================

@router.post("/extract")
async def extract(payload: dict):
    try:
        transcript = payload.get("transcript", "").strip()
        if not transcript:
            return {"error": "Transcript text is required"}

        result = await asyncio.to_thread(extract_from_transcript, transcript)
        return result.model_dump()
    except Exception as e:
        logger.exception("Data extraction failed")
        return {
            "summary": "Error during extraction.",
            "key_decisions": [],
            "action_items": [],
            "error": str(e)
        }

# =========================
# LANGGRAPH STREAMING
# =========================

@router.post("/langgraph/run")
async def langgraph_run(request: Request):
    async def event_stream():
        def sse(data):
            return f"data: {json.dumps(data)}\n\n"

        try:
            yield sse({"step": "start", "message": "Analyzing unread emails..."})
            poller, _ = await _ensure_poller(request)
            messages = await poller.poll_once() if poller else []
            
            if not messages:
                yield sse({"step": "complete", "message": "No new emails to process.", "results": []})
                return

            yield sse({"step": "emails_found", "count": len(messages)})

            results = []
            for email in messages:
                # Run AI Graph logic
                result = await asyncio.to_thread(run_graph, email, [])
                results.append(result)
                yield sse({"step": "processed", "subject": email.get("subject", "No Subject")})

            yield sse({"step": "complete", "results": results})
        except Exception as e:
            logger.exception("Streaming failed")
            yield sse({"step": "error", "message": str(e)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")