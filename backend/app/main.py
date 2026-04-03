from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import GMAIL_POLL_INTERVAL_SECONDS
from app.pollers.gmail_poller import GmailPoller

# In imports ko add kiya gaya hai initialization fix karne ke liye
from app.google.oauth import get_oauth_credentials
from app.google.gmail_api import build_gmail_service

# =========================
# LOGGING SETUP
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Autonomous Meeting Scheduler Backend")

# ==========================================
# 🔥 CORS FIX
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allows all. You can restrict later.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTES
# =========================
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Backend running 🚀"}

# =========================
# HELPERS: INITIALIZE POLLER
# =========================
async def init_gmail_poller():
    """
    Credentials lekar Gmail Service banata hai aur Poller initialize karta hai.
    """
    try:
        # 1. Get OAuth Credentials
        creds = await asyncio.to_thread(get_oauth_credentials)
        # 2. Build Gmail Service
        gmail_service = await asyncio.to_thread(build_gmail_service, creds)
        # 3. Create Poller with Service (Yahan error fix hua hai)
        return GmailPoller(gmail_service=gmail_service)
    except Exception as e:
        logger.error(f"Error initializing Gmail components: {e}")
        return None

# =========================
# GMAIL POLLING LOOP
# =========================
async def gmail_poll_loop(app_instance: FastAPI) -> None:
    """
    Background loop that polls Gmail every X seconds.
    """
    logger.info(f"Gmail polling loop started. Interval: {GMAIL_POLL_INTERVAL_SECONDS}s")
    
    while True:
        try:
            poller: GmailPoller | None = getattr(app_instance.state, "gmail_poller", None)
            
            if poller:
                logger.info("Checking for new emails...")
                await poller.poll_once()
            else:
                logger.warning("GmailPoller not found. Attempting to initialize...")
                new_poller = await init_gmail_poller()
                if new_poller:
                    app_instance.state.gmail_poller = new_poller
                    logger.info("GmailPoller initialized successfully.")

        except asyncio.CancelledError:
            logger.info("Polling loop stopping (Cancelled)...")
            break
        except Exception as e:
            logger.error(f"Polling error occurred: {str(e)}")
            await asyncio.sleep(5) 

        await asyncio.sleep(GMAIL_POLL_INTERVAL_SECONDS)

# =========================
# STARTUP EVENT
# =========================
@app.on_event("startup")
async def startup():
    # 1. Initialize Poller Instance Properly
    app.state.gmail_poller = await init_gmail_poller()
    
    if app.state.gmail_poller:
        logger.info("GmailPoller instance created during startup.")
    else:
        logger.error("Could not create GmailPoller during startup. Will retry in loop.")

    app.state.langgraph_last_result = None
    
    # 2. Start Background Task
    app.state.gmail_poll_task = asyncio.create_task(gmail_poll_loop(app))
    
    logger.info("Backend fully started 🚀")

# =========================
# SHUTDOWN EVENT
# =========================
@app.on_event("shutdown")
async def shutdown():
    task = getattr(app.state, "gmail_poll_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    logger.info("Backend stopped safely")