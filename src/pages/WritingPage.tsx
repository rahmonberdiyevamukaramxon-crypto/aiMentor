import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Exercise, AIFeedback, Attempt } from '../types';
import {
  PenTool,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  RotateCcw,
  RefreshCw,
  Award
} from 'lucide-react';

interface WritingPageProps {
  onBack: () => void;
  onNavigateTutor: () => void;
}

export const WritingPage: React.FC<WritingPageProps> = ({ onBack, onNavigateTutor }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [essayText, setEssayText] = useState('');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(2400); // 40 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadWritingExercises();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadWritingExercises = async () => {
    try {
      const res = await api.getExercises('writing');
      setExercises(res.exercises);
      if (res.exercises.length > 0) {
        setActiveExercise(res.exercises[0]);
      }
    } catch (err) {
      console.error('Failed to load writing exercises:', err);
    }
  };

  const startWritingSession = async (ex: Exercise) => {
    try {
      setActiveExercise(ex);
      setEssayText('');
      setEvaluation(null);
      const res = await api.startAttempt(ex.id);
      setAttempt(res.attempt);
      setTimeLeftSec(ex.duration_minutes * 60);
      setIsTimerRunning(true);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeftSec(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const wordCount = essayText.trim().length > 0 ? essayText.trim().split(/\s+/).length : 0;
  const minRequiredWords = activeExercise?.task_type === 'task1' ? 150 : 250;

  const handleSubmitEvaluation = async () => {
    if (!activeExercise) return;
    if (wordCount < 20) {
      alert('Insho juda qisqa. Kamida 20 ta so‘z yozing.');
      return;
    }

    try {
      setIsEvaluating(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);

      const res = await api.evaluateWriting(
        activeExercise.passage_or_prompt,
        essayText,
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            IELTS Academic Writing Moduli
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Task 1 & Task 2 AI Tahlili
          </h1>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          ← Boshqaruv paneliga qaytish
        </button>
      </div>

      {/* Main Split Layout: Prompt & Editor vs AI Rubric Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Task Prompt & Live Essay Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Task Prompt Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-teal-800 uppercase tracking-wider">
                {activeExercise?.task_type === 'task1' ? 'Task 1 (Hisobot)' : 'Task 2 (Insho)'}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{formatTimer(timeLeftSec)}</span>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 leading-snug">
              {activeExercise?.title}
            </h2>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-serif whitespace-pre-line">
              {activeExercise?.passage_or_prompt}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Talab: Kamida {minRequiredWords} ta so‘z yozing.</span>
              <span className="text-teal-700 font-medium">Akademik uslub</span>
            </div>
          </div>

          {/* Textarea Editor */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Sizning Insho Matningiz:
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-bold tabular-nums ${
                    wordCount >= minRequiredWords ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {wordCount} ta so‘z
                </span>
                {wordCount >= minRequiredWords && (
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    (Yetarli ✓)
                  </span>
                )}
              </div>
            </div>

            <textarea
              rows={16}
              value={essayText}
              onChange={e => setEssayText(e.target.value)}
              placeholder="Inshoni bu yerga yozing (Introduction, Body Paragraphs, Conclusion)..."
              className="w-full p-4 text-sm font-serif leading-relaxed border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            />

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                Insho avtomatik tahlil uchun Gemini AI modeliga yuboriladi
              </div>
              <button
                onClick={handleSubmitEvaluation}
                disabled={isEvaluating || wordCount < 20}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>IELTS Examiner Tahlil Qilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inshoni Tekshirishga Topshirish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Evaluation Rubric Report (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {evaluation ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Overall Band Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-teal-700 uppercase">
                    IELTS Band Bahosi
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Batafsil Kriteriyalar
                  </h3>
                </div>
                <div className="text-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="text-xs font-medium text-teal-700">Taxminiy Band</div>
                  <div className="text-2xl font-extrabold text-teal-800 tabular-nums">
                    {evaluation.overall_band?.toFixed(1) || '6.5'}
                  </div>
                </div>
              </div>

              {/* 4 Criteria Scores */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Rasmiy 4 Ta IELTS Mezoni:
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Task Response (TR)', score: evaluation.criterion_scores?.task_response },
                    { label: 'Coherence & Cohesion (CC)', score: evaluation.criterion_scores?.coherence_cohesion },
                    { label: 'Lexical Resource (LR)', score: evaluation.criterion_scores?.lexical_resource },
                    { label: 'Grammatical Range & Accuracy (GRA)', score: evaluation.criterion_scores?.grammatical_accuracy }
                  ].map((crit, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                      <span className="font-semibold text-slate-700">{crit.label}</span>
                      <span className="font-bold text-teal-800 tabular-nums">
                        Band {crit.score?.toFixed(1) || '6.0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Yutuqlaringiz:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {evaluation.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-md">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mistakes & Corrections */}
              {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Asosiy Xatolar va Takliflar:</span>
                  </div>
                  <div className="space-y-2">
                    {evaluation.mistakes.map((m: any, i: number) => (
                      <div key={i} className="p-3 bg-rose-50/50 border border-rose-200/70 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-rose-900">{m.category}:</div>
                        <div className="text-slate-600 italic">"{m.excerpt}"</div>
                        <div className="text-slate-800 font-medium">{m.explanation_uz}</div>
                        <div className="text-teal-800 font-bold pt-1 border-t border-rose-200/60">
                          Taklif: {m.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Band 8.5 Model Paragraph */}
              {evaluation.improved_sample && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200/60 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-indigo-900">
                    Namunaviy Band 8.5 Abzas (Model Paragraph):
                  </div>
                  <p className="font-serif italic text-slate-800 leading-relaxed">
                    "{evaluation.improved_sample}"
                  </p>
                </div>
              )}

              {/* Corrective Exercise */}
              {evaluation.corrective_exercise && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-amber-900">
                    Tavsiya Etilgan Tuzatish Mashqi:
                  </div>
                  <p className="text-amber-800">
                    {evaluation.corrective_exercise}
                  </p>
                </div>
              )}

              {/* Motivational Message */}
              {evaluation.motivational_uz && (
                <div className="p-3 bg-teal-50/60 border border-teal-200/60 rounded-lg text-xs text-teal-900">
                  <strong>Xulosa:</strong> {evaluation.motivational_uz}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 text-center">
                AI bahosi xalqaro mezonlar asosida berilgan tavsiyadir va rasmiy sertifikat o‘rnini bosmaydi.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Insho Baholash Rubrikasi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Inshongizni yozib "Inshoni Tekshirishga Topshirish" tugmasini bosing. AI Mentor har bir kriteriyani tahlil qilib, xatolarni ko‘rsatadi.
              </p>
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-800">TR / TA</div>
                  <div className="text-[11px]">Mavzuni to‘liq ochib berish</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-800">CC</div>
                  <div className="text-[11px]">Mantiqiy bog‘lanish</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-800">LR</div>
                  <div className="text-[11px]">Akademik lug‘at boyligi</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-800">GRA</div>
                  <div className="text-[11px]">Murakkab grammatika</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
