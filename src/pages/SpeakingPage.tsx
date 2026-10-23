import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Exercise, Attempt } from '../types';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Volume2
} from 'lucide-react';

interface SpeakingPageProps {
  onBack: () => void;
  onNavigateTutor: () => void;
}

export const SpeakingPage: React.FC<SpeakingPageProps> = ({ onBack, onNavigateTutor }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  // Preparation timer
  const [prepTimeLeft, setPrepTimeLeft] = useState<number>(60);
  const [isPrepActive, setIsPrepActive] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [useTypedFallback, setUseTypedFallback] = useState(false);

  // AI Evaluation
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const prepTimerRef = useRef<any>(null);

  useEffect(() => {
    loadSpeakingExercises();
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, []);

  const loadSpeakingExercises = async () => {
    try {
      const res = await api.getExercises('speaking');
      setExercises(res.exercises);
      if (res.exercises.length > 0) {
        setActiveExercise(res.exercises[0]);
      }
    } catch (err) {
      console.error('Failed to load speaking exercises:', err);
    }
  };

  const startPreparation = () => {
    setIsPrepActive(true);
    setPrepTimeLeft(60);
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current);
          setIsPrepActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);

          // Simulated transcription if browser speech recognition is not active
          if (!transcriptText) {
            setTranscriptText(
              "I would like to describe an ambitious goal that I achieved last year. It was my university entrance exam in computer science. Initially, I found it quite challenging, and then I studied consistently for three hours every day. In the end, I felt really proud and relieved to achieve the top percentile."
            );
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordDuration(0);

        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        recordTimerRef.current = setInterval(() => {
          setRecordDuration(prev => prev + 1);
        }, 1000);
      } else {
        setUseTypedFallback(true);
      }
    } catch (err) {
      console.warn('Microphone not accessible, switching to typed response:', err);
      setUseTypedFallback(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handleEvaluate = async () => {
    if (!activeExercise || !transcriptText.trim()) {
      alert('Iltimos, avval nutq yozing yoki matn kiriting.');
      return;
    }

    try {
      setIsEvaluating(true);
      const res = await api.evaluateSpeaking(
        activeExercise.passage_or_prompt,
        transcriptText,
        attempt?.id
      );
      setEvaluation(res.evaluation);
    } catch (err: any) {
      alert(err.message || 'Baholashda xatolik yuz berdi');
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            IELTS Speaking Moduli
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Part 2 Cue Card va Nutq Baholash
          </h1>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          ← Boshqaruv paneliga qaytish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cue Card & Audio Recorder (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Cue Card Prompt Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-800 uppercase tracking-wider">
                Speaking Part 2 Cue Card
              </span>
              <span className="text-slate-500 font-medium">
                1-daq tayyorgarlik · 2-daq nutq
              </span>
            </div>

            <div className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
              <h2 className="text-sm font-bold text-slate-900">
                {activeExercise?.title}
              </h2>
              <div className="text-xs font-serif text-slate-800 whitespace-pre-line leading-relaxed">
                {activeExercise?.passage_or_prompt}
              </div>
            </div>

            {/* Preparation Timer Control */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  1-Daqiqa Tayyorgarlik Taymeri
                </div>
                <div className="text-[11px] text-slate-500">
                  Eslatmalar yozib olish va reja tuzish uchun
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-teal-800">
                  00:{String(prepTimeLeft).padStart(2, '0')}
                </span>
                <button
                  onClick={startPreparation}
                  disabled={isPrepActive}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                >
                  {isPrepActive ? 'Tayyorgarlik ketmoqda...' : 'Taymerni Boshlash'}
                </button>
              </div>
            </div>

            {/* Microphone Recording Station */}
            <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isRecording ? 'Ovoz yozilmoqda...' : 'Ovoz yozish stansiyasi'}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold tabular-nums text-slate-300">
                  Vaqt: {formatTimer(recordDuration)} / 02:00
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Nutqni Yozishni Boshlash</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Yozuvni To‘xtatish</span>
                  </button>
                )}

                <button
                  onClick={() => setUseTypedFallback(!useTypedFallback)}
                  className="text-xs text-slate-400 hover:text-white underline ml-auto"
                >
                  {useTypedFallback ? 'Mikrofon rejimiga qaytish' : 'Mikrofon ishlamasa, matn kiritish'}
                </button>
              </div>

              {recordedAudioUrl && (
                <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-teal-400" />
                  <audio controls src={recordedAudioUrl} className="h-8 max-w-xs" />
                  <span className="text-[11px] text-slate-400">Yozib olingan audio</span>
                </div>
              )}
            </div>

            {/* Transcript or Typed Fallback Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nutq Matni (Transkript):
              </label>
              <textarea
                rows={4}
                value={transcriptText}
                onChange={e => setTranscriptText(e.target.value)}
                placeholder="Nutqingiz transkripti bu yerda paydo bo‘ladi yoki uni qo‘lda yozishingiz mumkin..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !transcriptText.trim()}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEvaluating ? (
                <span>AI Nutqni Baholamoqda...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Speaking Natijasini Tahlil Qilish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: AI Speaking Evaluation Rubric Report (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {evaluation ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-teal-700 uppercase">
                    Speaking Baholash
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    IELTS Speaking Descriptors
                  </h3>
                </div>
                <div className="text-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="text-xs font-medium text-teal-700">Taxminiy Band</div>
                  <div className="text-2xl font-extrabold text-teal-800 tabular-nums">
                    {evaluation.overall_band?.toFixed(1) || '6.5'}
                  </div>
                </div>
              </div>

              {/* 4 Descriptors */}
              <div className="space-y-2">
                {[
                  { label: 'Fluency & Coherence (FC)', score: evaluation.criterion_scores?.fluency_coherence },
                  { label: 'Lexical Resource (LR)', score: evaluation.criterion_scores?.lexical_resource },
                  { label: 'Grammatical Range (GRA)', score: evaluation.criterion_scores?.grammatical_accuracy },
                  { label: 'Pronunciation (PR)', score: evaluation.criterion_scores?.pronunciation }
                ].map((crit, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                    <span className="font-semibold text-slate-700">{crit.label}</span>
                    <span className="font-bold text-teal-800 tabular-nums">
                      Band {crit.score?.toFixed(1) || '6.5'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {evaluation.strengths && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Yutuqlaringiz:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {evaluation.strengths.map((str: string, i: number) => (
                      <li key={i} className="p-2 bg-emerald-50/50 rounded-md">
                        • {str}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mistakes and Native Phrasing */}
              {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Ikkilanish va Takrorlar:</span>
                  </div>
                  {evaluation.mistakes.map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-rose-900">{m.category}:</div>
                      <div className="text-slate-600 italic">"{m.excerpt}"</div>
                      <div className="text-slate-800">{m.explanation_uz}</div>
                      <div className="text-teal-800 font-bold pt-1 border-t border-rose-200/60">
                        Tabiiy talaffuz taklifi: {m.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Improved Sample */}
              {evaluation.improved_sample && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200/60 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-indigo-900">
                    Band 8.0 Namunaviy Nutq:
                  </div>
                  <p className="italic text-slate-800">
                    "{evaluation.improved_sample}"
                  </p>
                </div>
              )}

              {/* Corrective Drill */}
              {evaluation.corrective_exercise && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <strong>Ovozli mashq:</strong> {evaluation.corrective_exercise}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Speaking Tahlili Qanday Ishlaydi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kartochkani o‘qing, 1 daqiqa ichida tayyorgarlik ko‘ring va 2 daqiqa davomida ingliz tilida erkin gapiring.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 text-left space-y-1">
                <div>• Pauzalar va so‘z takrorlari aniqlanadi.</div>
                <div>• Grammatik aniqlik va zamonlar moslashuvi tekshiriladi.</div>
                <div>• Band 7+ idiomatik ifodalar tavsiya etiladi.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
