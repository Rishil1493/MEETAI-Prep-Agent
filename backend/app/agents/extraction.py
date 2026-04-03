from __future__ import annotations

from typing import Optional
import logging
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import GROQ_API_KEY

logger = logging.getLogger(__name__)

# ── Pydantic schema ──────────────────────────────────────────────────────────

class ActionItem(BaseModel):
    # Frontend 'text' expect kar raha hai, isliye description ki jagah text use kar rahe hain
    text: str = Field(description="The specific task or action that needs to be done")
    assignee: Optional[str] = Field(default="Unassigned", description="Person responsible")
    deadline: Optional[str] = Field(default="TBD", description="Due date or timeframe")
    priority: str = Field(default="medium", description="Priority level: high, medium, or low")

class KeyDecision(BaseModel):
    decision: str = Field(description="A key decision made during the meeting")
    owner: Optional[str] = Field(default=None, description="Person who owns this decision")

class MeetingExtractionResult(BaseModel):
    summary: str = Field(description="2-3 sentence concise summary of the meeting")
    key_decisions: list[KeyDecision] = Field(default_factory=list, description="List of key decisions")
    action_items: list[ActionItem] = Field(default_factory=list, description="List of action items")

# ── Chain ────────────────────────────────────────────────────────────────────

_parser = PydanticOutputParser(pydantic_object=MeetingExtractionResult)

_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        (
            "You are an expert meeting analyst. Extract structured information from the "
            "meeting transcript provided. Be precise and concise. Only include what is explicitly "
            "stated or clearly implied. Format the output as valid JSON.\n\n"
            "{format_instructions}"
        ),
    ),
    ("human", "Transcript:\n\n{transcript}"),
])

def build_extraction_chain():
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not found in config.")
        raise ValueError("GROQ_API_KEY is not set in environment.")
    
    # Using Llama 3 for fast and accurate extraction
    llm = ChatGroq(
        model="llama-3.3-70b-versatile", 
        temperature=0, 
        api_key=GROQ_API_KEY
    )
    return _PROMPT | llm | _parser

def extract_from_transcript(transcript: str) -> MeetingExtractionResult:
    """
    Invokes the LLM chain to extract meeting insights.
    """
    try:
        logger.info("Starting AI extraction from transcript...")
        chain = build_extraction_chain()
        result = chain.invoke({
            "transcript": transcript,
            "format_instructions": _parser.get_format_instructions(),
        })
        logger.info("Extraction complete!")
        return result
    except Exception as e:
        logger.exception("Extraction chain failed")
        # Return a safe empty result instead of crashing
        return MeetingExtractionResult(
            summary="Error processing transcript.",
            key_decisions=[],
            action_items=[]
        )