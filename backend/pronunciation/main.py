"""
FastAPI Backend for Pronunciation Analysis with openSMILE
Endpoint: POST /analyze-pronunciation
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import logging

from pronunciation_analyzer import PronunciationAnalyzer
from pronunciation_scorer import PronunciationScorer
from reference_audio_generator import ReferenceAudioGenerator
import asyncio
from collections.abc import AsyncGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinguaFlow Pronunciation API", version="1.0.0")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite/React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzers
pronunciation_analyzer = PronunciationAnalyzer()
pronunciation_scorer = PronunciationScorer()
reference_generator = ReferenceAudioGenerator()


class PronunciationResponse(BaseModel):
    overall_score: float
    pitch_score: float
    fluency_score: float
    quality_score: float
    text_accuracy: float
    transcription: str
    detailed_feedback: str
    user_metrics: dict
    reference_metrics: dict


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "LinguaFlow Pronunciation API",
        "version": "1.0.0"
    }


@app.post("/analyze-pronunciation", response_model=PronunciationResponse)
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    expected_text: str = Form(...),
    reference_audio_path: Optional[str] = Form(None)
):
    """
    Analyze user's pronunciation and compare with reference
    
    Args:
        audio: User's audio file (WAV, 16kHz, mono recommended)
        expected_text: Expected text transcript
        reference_audio_path: Optional path to native speaker reference audio
    
    Returns:
        PronunciationResponse with scores, transcription, and feedback
    """
    
    try:
        # Save uploaded audio temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            contents = await audio.read()
            temp_audio.write(contents)
            user_audio_path = temp_audio.name
        
        logger.info(f"Analyzing pronunciation for text: {expected_text}")
        
        # Extract features from user audio
        user_metrics = pronunciation_analyzer.extract_features(user_audio_path)
        
        # Extract features from reference audio if provided
        reference_metrics = None
        if reference_audio_path and os.path.exists(reference_audio_path):
            reference_metrics = pronunciation_analyzer.extract_features(reference_audio_path)
        
        # Calculate scores
        result = pronunciation_scorer.compare_with_reference(
            user_metrics=user_metrics,
            reference_metrics=reference_metrics,
            expected_text=expected_text,
            user_audio_path=user_audio_path
        )
        
        # Clean up temporary file
        os.unlink(user_audio_path)
        
        logger.info(f"Analysis complete. Overall score: {result['overall_score']:.2f}")
        
        return JSONResponse(content=result)
    
    except Exception as e:
        logger.error(f"Error during pronunciation analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "opensmile": "configured",
        "models": "loaded",
        "tts": "piper-tts available"
    }


@app.post("/generate-reference")
async def generate_reference(text: str = Form(...)):
    """
    Generate reference audio using Piper TTS
    
    Args:
        text: Text to synthesize into speech
    
    Returns:
        Path to generated reference audio file
    """
    try:
        logger.info(f"Generating reference audio for: {text}")
        
        audio_path = reference_generator.generate_reference_audio(text)
        
        return JSONResponse(content={
            "status": "success",
            "audio_path": audio_path,
            "text": text
        })
    
    except Exception as e:
        logger.error(f"Reference generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/generate-lesson-references")
async def generate_lesson_references(phrases: dict):
    """
    Generate multiple reference audios for a lesson
    
    Args:
        phrases: Dict mapping phrase_id to text
    
    Returns:
        Dict with generated audio paths
    """
    try:
        logger.info(f"Generating {len(phrases)} lesson references")
        
        results = reference_generator.generate_lesson_references(phrases)
        
        return JSONResponse(content={
            "status": "success",
            "references": results
        })
    
    except Exception as e:
        logger.error(f"Lesson reference generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/list-references")
async def list_references():
    """List all available reference audio files"""
    references = reference_generator.list_references()
    return JSONResponse(content={
        "status": "success",
        "count": len(references),
        "references": references
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
