"""
ReferenceAudioGenerator - Generate native speaker reference audio using Piper TTS
"""

import os
import wave
import logging
from pathlib import Path
from typing import Optional
from piper import PiperVoice

logger = logging.getLogger(__name__)


class ReferenceAudioGenerator:
    """Generate reference audio files using Piper TTS"""
    
    def __init__(self, voice_model_path: Optional[str] = None):
        """
        Initialize Piper TTS for reference audio generation
        
        Args:
            voice_model_path: Path to .onnx voice model file
                            Defaults to en_US-lessac-medium if not specified
        """
        self.references_dir = Path("references")
        self.references_dir.mkdir(exist_ok=True)
        
        # Default to en_US-lessac-medium (high quality American English voice)
        if voice_model_path is None:
            voice_model_path = self._get_default_voice()
        
        logger.info(f"Loading Piper TTS voice: {voice_model_path}")
        
        try:
            self.voice = PiperVoice.load(voice_model_path)
            logger.info("Piper TTS voice loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Piper voice: {str(e)}")
            logger.info("Run: python3 -m piper.download_voices en_US-lessac-medium")
            raise
    
    def _get_default_voice(self) -> str:
        """
        Get path to default voice model
        
        Returns:
            Path to voice model file
        """
        # Check common locations
        possible_paths = [
            Path.home() / ".local" / "share" / "piper-voices" / "en_US-lessac-medium.onnx",
            Path("models") / "en_US-lessac-medium.onnx",
            Path("/usr/share/piper-voices/en_US-lessac-medium.onnx"),
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"Found voice model at: {path}")
                return str(path)
        
        # If not found, return expected location (will need download)
        default_path = Path.home() / ".local" / "share" / "piper-voices" / "en_US-lessac-medium.onnx"
        logger.warning(f"Voice model not found. Expected at: {default_path}")
        logger.warning("Download with: python3 -m piper.download_voices en_US-lessac-medium")
        return str(default_path)
    
    def generate_reference_audio(
        self,
        text: str,
        output_filename: Optional[str] = None,
        speed: float = 1.0,
        volume: float = 1.0
    ) -> str:
        """
        Generate reference audio file from text
        
        Args:
            text: Text to synthesize
            output_filename: Optional custom filename (without .wav extension)
            speed: Speech speed (1.0 = normal, <1.0 = slower, >1.0 = faster)
            volume: Audio volume (0.0-1.0)
        
        Returns:
            Path to generated audio file
        """
        try:
            # Generate filename if not provided
            if output_filename is None:
                # Use first 50 chars of text, sanitize for filename
                safe_text = "".join(c if c.isalnum() or c.isspace() else "_" for c in text[:50])
                safe_text = safe_text.strip().replace(" ", "_")
                output_filename = f"ref_{safe_text}"
            
            output_path = self.references_dir / f"{output_filename}.wav"
            
            logger.info(f"Generating reference audio: {text}")
            
            # Configure synthesis
            from piper.download import SynthesisConfig
            
            syn_config = SynthesisConfig(
                volume=volume,
                length_scale=1.0 / speed,  # Piper uses length_scale inverse of speed
                noise_scale=0.667,  # Less audio variation for clearer reference
                noise_w_scale=0.8,  # Less speaking variation for consistency
                normalize_audio=True,
            )
            
            # Generate audio
            with wave.open(str(output_path), "wb") as wav_file:
                self.voice.synthesize_wav(text, wav_file, syn_config=syn_config)
            
            logger.info(f"Reference audio generated: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Failed to generate reference audio: {str(e)}")
            raise
    
    def generate_lesson_references(self, phrases: dict) -> dict:
        """
        Generate reference audio for multiple lesson phrases
        
        Args:
            phrases: Dict mapping phrase_id to text
                    Example: {"greeting": "Hello everyone", "intro": "My name is..."}
        
        Returns:
            Dict mapping phrase_id to generated audio file path
        """
        results = {}
        
        for phrase_id, text in phrases.items():
            try:
                output_path = self.generate_reference_audio(text, output_filename=phrase_id)
                results[phrase_id] = output_path
                logger.info(f"Generated reference for '{phrase_id}': {output_path}")
            except Exception as e:
                logger.error(f"Failed to generate reference for '{phrase_id}': {str(e)}")
                results[phrase_id] = None
        
        return results
    
    def list_references(self) -> list:
        """
        List all generated reference audio files
        
        Returns:
            List of reference audio file paths
        """
        if not self.references_dir.exists():
            return []
        
        wav_files = list(self.references_dir.glob("*.wav"))
        return [str(f) for f in wav_files]
    
    def clear_references(self):
        """Delete all generated reference audio files"""
        if not self.references_dir.exists():
            return
        
        for wav_file in self.references_dir.glob("*.wav"):
            try:
                wav_file.unlink()
                logger.info(f"Deleted reference: {wav_file}")
            except Exception as e:
                logger.error(f"Failed to delete {wav_file}: {str(e)}")
