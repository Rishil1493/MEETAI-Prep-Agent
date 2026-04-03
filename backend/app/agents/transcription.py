from __future__ import annotations
import os
import warnings
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def transcribe(audio_path: str | Path) -> str:
    """
    Transcribe an audio file using OpenAI Whisper (local model).
    """
    path = Path(audio_path)
    if not path.exists():
        logger.error(f"Audio file not found at: {path}")
        raise FileNotFoundError(f"Audio file not found: {path}")

    # Testing ke liye agar .txt file di hai
    if path.suffix.lower() == ".txt":
        logger.info(f"Reading transcript directly from text file: {path.name}")
        return path.read_text(encoding="utf-8").strip()

    # ffmpeg path setup
    ffmpeg_bin = r"C:\Users\Aser\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin"
    if os.path.exists(ffmpeg_bin) and ffmpeg_bin not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_bin + os.pathsep + os.environ.get("PATH", "")
        logger.info("FFmpeg path added to environment.")

    try:
        import whisper  # Lazy import
        
        logger.info(f"Loading Whisper 'base' model and transcribing: {path.name}")
        
        # Model load ho raha hai (Pehli baar download hone mein time lag sakta hai)
        model = whisper.load_model("base")
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # Result extract kar rahe hain
            result = model.transcribe(str(path), fp16=False) # fp16=False for better CPU compatibility
            
        transcript_text = result.get("text", "").strip()
        
        if not transcript_text:
            logger.warning("Whisper returned empty transcript.")
            return ""

        logger.info("Transcription successful!")
        return transcript_text

    except ImportError:
        logger.error("Whisper library not found. Run 'pip install openai-whisper'")
        return "Error: Whisper library not installed."
    except Exception as e:
        logger.exception(f"Transcription failed: {str(e)}")
        return f"Error during transcription: {str(e)}"