/**
 * PronunciationTest - Component for pronunciation practice with audio recording
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Loader2, Volume2, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioRecorder, analyzePronunciation, generateReferenceAudio, type PronunciationResult } from '../services/pronunciationService';

interface PronunciationTestProps {
  phrase: string;
  phraseId: string;
  onComplete?: (score: number) => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

const PronunciationTest: React.FC<PronunciationTestProps> = ({ phrase, phraseId, onComplete }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [referenceAudioPath, setReferenceAudioPath] = useState<string | null>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [isGeneratingReference, setIsGeneratingReference] = useState(false);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const referencePlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Generate reference audio on mount
    generateReference();
    
    return () => {
      // Cleanup
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [phrase, phraseId]);

  const generateReference = async () => {
    setIsGeneratingReference(true);
    setError(null);
    try {
      const response = await generateReferenceAudio(phrase);
      setReferenceAudioPath(response.audio_path);
      setReferenceAudioUrl(response.audio_url ?? null);
    } catch (err) {
      console.error('Failed to generate reference:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao gerar áudio de referência';
      setError(`⚠️ ${errorMsg}. Você ainda pode gravar sua pronúncia.`);
      setReferenceAudioUrl(null);
      // Continue without reference - user can still record
    } finally {
      setIsGeneratingReference(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      await recorderRef.current.startRecording();
      setRecordingState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setRecordingState('error');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) return;

      setRecordingState('processing');
      const audioBlob = await recorderRef.current.stopRecording();
      
      // Create audio URL for playback
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Analyze pronunciation
      const analysisResult = await analyzePronunciation(
        audioBlob,
        phrase,
        referenceAudioPath || undefined
      );

      setResult(analysisResult);
      setRecordingState('completed');
      
      if (onComplete) {
        onComplete(analysisResult.overall_score);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setRecordingState('error');
    }
  };

  const reset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setResult(null);
    setError(null);
    setRecordingState('idle');
  };

  const playRecording = () => {
    if (audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current.play();
    }
  };

  const playReference = () => {
    if (referencePlayerRef.current && referenceAudioPath) {
      // Extract filename from path (e.g., "references/ref_hello.mp3" -> "ref_hello.mp3")
      const filename = referenceAudioPath.split('/').pop() || referenceAudioPath;
      const fullPath = referenceAudioUrl ?? `http://localhost:8000/references/${filename}`;
      referencePlayerRef.current.src = fullPath;
      referencePlayerRef.current.play();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/20';
    return 'bg-rose-500/20';
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6 space-y-6">
      {/* Phrase Display */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Pratique esta frase:</h3>
        <p className="text-2xl font-bold text-emerald-300 mb-4">{phrase}</p>
        
        {isGeneratingReference && (
          <p className="text-sm text-gray-400">Gerando áudio de referência...</p>
        )}
      </div>

      {/* Reference Audio Player */}
      {referenceAudioPath && !isGeneratingReference && (
        <div className="flex justify-center gap-2">
          <button
            onClick={playReference}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Volume2 className="h-4 w-4" />
            Ouvir pronúncia nativa
          </button>
          <audio ref={referencePlayerRef} className="hidden" />
        </div>
      )}
      
      {/* Retry Reference Generation if Failed */}
      {!referenceAudioPath && !isGeneratingReference && error && (
        <div className="flex justify-center">
          <button
            onClick={generateReference}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-500"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar gerar áudio novamente
          </button>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex justify-center gap-4">
        {recordingState === 'idle' && (
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-rose-500"
          >
            <Mic className="h-6 w-6" />
            Gravar minha pronúncia
          </button>
        )}

        {recordingState === 'recording' && (
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-full bg-gray-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-gray-600 animate-pulse"
          >
            <Square className="h-6 w-6 fill-current" />
            Parar gravação
          </button>
        )}

        {recordingState === 'processing' && (
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-700 px-6 py-3 text-lg font-semibold text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            Analisando...
          </div>
        )}

        {(recordingState === 'completed' || recordingState === 'error') && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
          >
            <RotateCcw className="h-6 w-6" />
            Tentar novamente
          </button>
        )}
      </div>

      {/* Playback Controls */}
      {audioUrl && recordingState !== 'recording' && (
        <div className="flex justify-center">
          <button
            onClick={playRecording}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-600"
          >
            <Play className="h-4 w-4" />
            Ouvir minha gravação
          </button>
          <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/50 p-4">
          <div className="flex items-center gap-2 text-rose-200">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Erro</p>
          </div>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4 rounded-lg bg-gray-900/60 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">Resultado da Análise</h4>
            <div className={`rounded-full px-4 py-2 ${getScoreBgColor(result.overall_score)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                {Math.round(result.overall_score)}
              </span>
              <span className="text-sm text-gray-400">/100</span>
            </div>
          </div>

          {/* Subscores */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-800/70 p-3 text-center">
              <div className="text-xs text-gray-400">Entonação</div>
              <div className={`mt-1 text-lg font-bold ${getScoreColor(result.pitch_score)}`}>
                {Math.round(result.pitch_score)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-800/70 p-3 text-center">
              <div className="text-xs text-gray-400">Fluência</div>
              <div className={`mt-1 text-lg font-bold ${getScoreColor(result.fluency_score)}`}>
                {Math.round(result.fluency_score)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-800/70 p-3 text-center">
              <div className="text-xs text-gray-400">Clareza</div>
              <div className={`mt-1 text-lg font-bold ${getScoreColor(result.quality_score)}`}>
                {Math.round(result.quality_score)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-800/70 p-3 text-center">
              <div className="text-xs text-gray-400">Precisão</div>
              <div className={`mt-1 text-lg font-bold ${getScoreColor(result.text_accuracy)}`}>
                {Math.round(result.text_accuracy)}
              </div>
            </div>
          </div>

          {/* Transcription */}
          {result.transcription && (
            <div>
              <h5 className="text-sm font-semibold text-gray-400 mb-1">O que foi reconhecido:</h5>
              <p className="text-white font-medium">"{result.transcription}"</p>
            </div>
          )}

          {/* Feedback */}
          <div className="rounded-lg bg-gray-800/50 p-4">
            <div className="flex items-start gap-2">
              {result.overall_score >= 85 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-300">{result.detailed_feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationTest;
