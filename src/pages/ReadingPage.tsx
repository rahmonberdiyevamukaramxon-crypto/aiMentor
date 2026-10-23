import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Exercise, Question, Attempt } from '../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Layers,
  Info,
  Zap,
  Type
} from 'lucide-react';

interface ReadingPageProps {
  onBack: () => void;
  onNavigateTutor: () => void;
}

export const ReadingPage: React.FC<ReadingPageProps> = ({ onBack, onNavigateTutor }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Results state
  const [results, setResults] = useState<{
    attempt: Attempt;
    score: number;
    total: number;
    band_estimate: number;
    details: { question: Question; user_answer: string; is_correct: boolean }[];
  } | null>(null);

  // Timer state
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const timerRef = useRef<any>(null);

  // Focus & Disappearing Reading Mode States
  const [readingMode, setReadingMode] = useState<'focus_disappear' | 'classic'>('focus_disappear');
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [fadedParagraphs, setFadedParagraphs] = useState<number[]>([]);
  const [peekIndices, setPeekIndices] = useState<number[]>([]);
  const [isAllRead, setIsAllRead] = useState<boolean>(false);
  const [autoPacing, setAutoPacing] = useState<boolean>(false);
  const [autoSeconds, setAutoSeconds] = useState<number>(25);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const autoPacingTimerRef = useRef<any>(null);
  const passageScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReadingExercises();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoPacingTimerRef.current) clearInterval(autoPacingTimerRef.current);
    };
  }, []);

  const loadReadingExercises = async () => {
    try {
      const res = await api.getExercises('reading');
      setExercises(res.exercises);
      if (res.exercises.length > 0) {
        setActiveExercise(res.exercises[0]);
      }
    } catch (err) {
      console.error('Failed to load reading exercises:', err);
    }
  };

  const handleStartExam = async (exercise: Exercise) => {
    try {
      setIsSubmitting(true);
      const res = await api.startAttempt(exercise.id);
      setAttempt(res.attempt);
      setActiveExercise(res.exercise);
      setQuestions(res.questions);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setResults(null);

      // Initialize Focus Reading Mode
      setReadingMode('focus_disappear');
      setActiveParagraphIndex(0);
      setFadedParagraphs([]);
      setPeekIndices([]);
      setIsAllRead(false);
      setAutoProgress(0);

      // Initialize countdown from server deadline
      const deadline = new Date(res.attempt.deadline_at).getTime();
      const now = new Date(res.server_time).getTime();
      const diffSec = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeftSec(diffSec);

      startClientTimer(deadline);
    } catch (err: any) {
      alert(err.message || 'Sinovni boshlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startClientTimer = (deadlineTime: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);
  };

  // Auto-pacing timer for focus mode
  const paragraphs = activeExercise?.passage_or_prompt
    ? activeExercise.passage_or_prompt.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    : [];

  const getParaLabel = (idx: number) => {
    return String.fromCharCode(65 + (idx % 26)); // A, B, C, D, E...
  };

  useEffect(() => {
    if (autoPacingTimerRef.current) clearInterval(autoPacingTimerRef.current);

    if (attempt && !results && readingMode === 'focus_disappear' && autoPacing && !isAllRead && paragraphs.length > 0) {
      const intervalMs = 250;
      const stepIncrement = (intervalMs / (autoSeconds * 1000)) * 100;
      autoPacingTimerRef.current = setInterval(() => {
        setAutoProgress(prev => {
          if (prev >= 100) {
            markCurrentParagraphAsRead();
            return 0;
          }
          return prev + stepIncrement;
        });
      }, intervalMs);
    }

    return () => {
      if (autoPacingTimerRef.current) clearInterval(autoPacingTimerRef.current);
    };
  }, [attempt, results, readingMode, autoPacing, isAllRead, activeParagraphIndex, paragraphs.length, autoSeconds]);

  const markCurrentParagraphAsRead = () => {
    if (activeParagraphIndex >= paragraphs.length) return;

    setFadedParagraphs(prev => [...new Set([...prev, activeParagraphIndex])]);
    setAutoProgress(0);

    const nextIndex = activeParagraphIndex + 1;
    if (nextIndex >= paragraphs.length) {
      setIsAllRead(true);
      // Automatically restore full text so the user can easily answer questions
      setReadingMode('classic');
    } else {
      setActiveParagraphIndex(nextIndex);
      if (passageScrollRef.current) {
        passageScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Restore full text to original state
  const restoreFullText = () => {
    setReadingMode('classic');
    setFadedParagraphs([]);
    setPeekIndices([]);
    setAutoProgress(0);
  };

  // Restart focus mode
  const restartFocusMode = () => {
    setReadingMode('focus_disappear');
    setActiveParagraphIndex(0);
    setFadedParagraphs([]);
    setPeekIndices([]);
    setIsAllRead(false);
    setAutoProgress(0);
  };

  const togglePeek = (idx: number) => {
    setPeekIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleAnswerChange = async (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    setSaveStatus('Saqlanmoqda...');

    if (attempt) {
      try {
        await api.saveAnswer(attempt.id, questionId, answer);
        setSaveStatus('Saqlandi ✓');
        setTimeout(() => setSaveStatus(''), 1500);
      } catch (err) {
        setSaveStatus('Xatolik');
      }
    }
  };

  const handleAutoSubmit = async () => {
    if (!attempt || results) return;
    try {
      setIsSubmitting(true);
      const res = await api.submitAttempt(attempt.id);
      setResults(res);
      setAttempt(res.attempt);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoPacingTimerRef.current) clearInterval(autoPacingTimerRef.current);
    } catch (err) {
      console.error('Auto submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt) return;
    const unanswered = questions.length - Object.keys(userAnswers).length;
    if (unanswered > 0) {
      const confirmSubmit = window.confirm(
        `Sizda hali ${unanswered} ta javob berilmagan savol bor. Baribir topshirasizmi?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitAttempt(attempt.id);
      setResults(res);
      setAttempt(res.attempt);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoPacingTimerRef.current) clearInterval(autoPacingTimerRef.current);
    } catch (err: any) {
      alert(err.message || 'Topshirishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-[14px] leading-6'
      : fontSize === 'lg'
      ? 'text-[17px] leading-8'
      : 'text-[15px] leading-7';

  // 1. Initial State: List of Reading Passages
  if (!attempt && !results) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
              IELTS Academic Reading Moduli
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              Akademik Matnlar va Vaqt Nazorati
            </h1>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ← Bosh sahifaga qaytish
          </button>
        </div>

        {/* Feature Highlight Banner: Focused Disappearing Reading */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-teal-900">
                Yangi: Fokusli va Asta-sekin O‘chish Rejimi (Speed & Retention Focus)
              </h2>
              <p className="text-xs text-teal-700 mt-1 max-w-2xl leading-relaxed">
                Uzun matnlarni o‘qishda ko‘z chalkashishi va diqqat bo‘linishining oldini olish uchun matn paragrafma-paragraf beriladi va o‘qilgan qism asta-sekin o‘chib boradi. Matnni tushungach, savollarni yechish uchun <strong>"Matnni Asl Holiga Qaytaring"</strong> tugmasi orqali istalgan soniyada butun matnni 100% tiklashingiz mumkin!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-teal-800 bg-white/80 px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
              ✓ Band 7.5+ Strategiyasi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.map(ex => (
            <div
              key={ex.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="capitalize">{ex.sub_type.replace('_', ' ')}</span>
                  <span className="font-semibold text-teal-700">{ex.duration_minutes} daqiqa</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  {ex.title}
                </h2>
                <div className="text-xs text-slate-600 mb-4 line-clamp-3">
                  {ex.description_uz}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 mb-4 line-clamp-3 italic">
                  "{ex.passage_or_prompt.substring(0, 220)}..."
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Qiyinlik darajasi: <strong className="capitalize text-slate-800">{ex.difficulty}</strong>
                </span>
                <button
                  onClick={() => handleStartExam(ex)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Imtihonni Boshlash</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Results and Error Analysis View
  if (results) {
    const accuracy = Math.round((results.score / results.total) * 100);
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                Mashq Yakunlandi
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Reading Natijasi va Xatolar Tahlili
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeExercise?.title}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="text-xs font-medium text-teal-700">Taxminiy Band</div>
                <div className="text-2xl font-extrabold text-teal-800 tabular-nums">
                  {results.band_estimate.toFixed(1)}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-medium text-slate-500">To‘g‘ri Javob</div>
                <div className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {results.score} / {results.total}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Sarflangan vaqt:</span>{' '}
              {results.attempt.duration_seconds
                ? `${Math.floor(results.attempt.duration_seconds / 60)} daq ${results.attempt.duration_seconds % 60} soniya`
                : '15 daqiqa'}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Aniqlik darajasi:</span>{' '}
              {accuracy}%
            </div>
            <div>
              <span className="font-semibold text-slate-800">Status:</span>{' '}
              <span className="text-emerald-700 font-bold">Tekshirildi ✓</span>
            </div>
          </div>
        </div>

        {/* Detailed Question Review with Evidence and Explanations */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Savollar Tahlili va Matndagi Dalillar (Evidence)
          </h2>

          {results.details.map((item) => (
            <div
              key={item.question.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-colors ${
                item.is_correct ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  {item.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-800">
                    Savol {item.question.question_number}: {item.question.question_text}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                    item.is_correct
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {item.is_correct ? 'To‘g‘ri' : 'Xato'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs my-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500">Sizning javobingiz:</span>{' '}
                  <span
                    className={`font-bold ${
                      item.is_correct ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {item.user_answer || '(Javob berilmadi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">To‘g‘ri javob:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {item.question.correct_answer}
                  </span>
                </div>
              </div>

              {/* Uzbek Explanation */}
              {item.question.explanation_uz && (
                <div className="mt-3 text-xs text-slate-700 bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg">
                  <span className="font-bold text-amber-900">Tushuntirish:</span>{' '}
                  {item.question.explanation_uz}
                </div>
              )}

              {/* Passage Evidence */}
              {item.question.evidence_passage && (
                <div className="mt-2 text-xs text-slate-600 bg-blue-50/60 border border-blue-200/60 p-3 rounded-lg">
                  <span className="font-bold text-blue-900">Matndagi Dalil (Evidence):</span>{' '}
                  <span className="italic">"{item.question.evidence_passage}"</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => {
              setResults(null);
              setAttempt(null);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            ← Mashqlar Ro‘yxatiga Qaytish
          </button>

          <button
            onClick={onNavigateTutor}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Ushbu xatolar bo‘yicha AI Ustozdan so‘rash</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Timed Exam View (2-Zone Split Layout)
  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const isLowTime = timeLeftSec < 120 && timeLeftSec > 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100">
      {/* Exam Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
            IELTS Reading Passage
          </span>
          <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs md:max-w-md">
            {activeExercise?.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus && (
            <span className="text-xs text-slate-400 font-mono transition-opacity">
              {saveStatus}
            </span>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold tabular-nums ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Qolgan vaqt: {formatTimer(timeLeftSec)}</span>
          </div>

          <div className="text-xs text-slate-500 tabular-nums hidden sm:block">
            Javob berildi: <strong>{answeredCount}</strong> / {questions.length}
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Topshirilmoqda...' : 'Topshirish (Finish)'}
          </button>
        </div>
      </div>

      {/* Low Time Alert Banner */}
      {isLowTime && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-1.5 text-xs text-rose-800 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>
            Diqqat! Imtihon vaqti tugashiga 2 daqiqadan kam vaqt qoldi. Server taymeri muddatni avtomatik yakunlaydi.
          </span>
        </div>
      )}

      {/* 2-Zone Balanced Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Zone: Passage (7 cols) with Focus & Disappearing Mode */}
        <div
          ref={passageScrollRef}
          className="lg:col-span-7 bg-white border-r border-slate-200 flex flex-col overflow-y-auto"
        >
          {/* Top Passage Control Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-5 py-3 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Switcher Tabs */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setReadingMode('focus_disappear')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    readingMode === 'focus_disappear'
                      ? 'bg-white text-teal-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>🎯 Fokusli O‘chish Rejimi</span>
                </button>
                <button
                  onClick={restoreFullText}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    readingMode === 'classic'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>📄 To‘liq Matn (Klassik)</span>
                </button>
              </div>

              {/* High-Priority Restore Full Text Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={restoreFullText}
                  title="O‘qib bo‘lgach yoki savollarni ishlash uchun butun matnni 100% asl holiga qaytarish"
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border shadow-2xs ${
                    readingMode === 'focus_disappear' && fadedParagraphs.length > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200 animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Matnni Asl Holiga Qaytaring</span>
                </button>

                {/* Font Size Toggle */}
                <div className="hidden sm:inline-flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[11px] font-bold">
                  <button
                    onClick={() => setFontSize('sm')}
                    className={`px-2 py-1 rounded ${fontSize === 'sm' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    title="Kichik shrift"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize('base')}
                    className={`px-2 py-1 rounded ${fontSize === 'base' ? 'bg-white shadow-2xs text-teal-800' : 'text-slate-500'}`}
                    title="Standart shrift"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('lg')}
                    className={`px-2 py-1 rounded ${fontSize === 'lg' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    title="Katta shrift"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* In Focus Mode: Interactive Progress & Controls Bar */}
            {readingMode === 'focus_disappear' && (
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-teal-800">
                    O‘qish jarayoni:
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">
                    Paragraf {Math.min(activeParagraphIndex + 1, paragraphs.length)} / {paragraphs.length}
                  </span>
                  <span className="text-slate-400">
                    ({Math.round((fadedParagraphs.length / Math.max(1, paragraphs.length)) * 100)}% o‘qildi)
                  </span>
                </div>

                {/* Optional Auto-pacing timer toggle */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={autoPacing}
                      onChange={e => setAutoPacing(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>Avto-o‘chish taymeri ({autoSeconds}s)</span>
                  </label>

                  {fadedParagraphs.length > 0 && (
                    <button
                      onClick={restartFocusMode}
                      className="text-[11px] text-slate-500 hover:text-teal-700 underline decoration-dotted"
                    >
                      Boshidan o‘qish
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reading Progress Indicator Bar */}
            {readingMode === 'focus_disappear' && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{
                    width: `${Math.round((fadedParagraphs.length / Math.max(1, paragraphs.length)) * 100)}%`
                  }}
                />
              </div>
            )}

            {/* Auto-Pacing Countdown Bar */}
            {readingMode === 'focus_disappear' && autoPacing && !isAllRead && (
              <div className="w-full h-1 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-200 ease-linear"
                  style={{ width: `${autoProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Main Passage Content Body */}
          <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                Reading Passage
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1 pb-3 border-b border-slate-100">
                {activeExercise?.title}
              </h1>
            </div>

            {/* Informational Guidance Banner */}
            {showInfoBanner && readingMode === 'focus_disappear' && (
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-teal-950">
                      Chalkashliksiz Fokusli O‘qish Qoidasi:
                    </p>
                    <p className="text-teal-800 leading-relaxed">
                      1. Har bir paragrafni xotirjam o‘qib tushuning.<br />
                      2. <strong>"O‘qib bo‘ldim"</strong> tugmasini bosganingizda, o‘qilgan matn sekin o‘chib boradi va diqqatingiz faqat keyingi qismga qaratiladi.<br />
                      3. Matn tugab tushunganingizdan so‘ng, savollarni yechish uchun <strong>"Matnni Asl Holiga Qaytaring"</strong> tugmasini bosing — butun matn to‘liq ochiladi!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoBanner(false)}
                  className="text-teal-500 hover:text-teal-800 p-1 text-sm font-bold"
                  title="Yopish"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 1. FOCUS & DISAPPEARING MODE RENDERING */}
            {readingMode === 'focus_disappear' && (
              <div className="space-y-5">
                {paragraphs.map((para, i) => {
                  const isFaded = fadedParagraphs.includes(i);
                  const isCurrent = i === activeParagraphIndex;
                  const isUpcoming = i > activeParagraphIndex;
                  const isPeeking = peekIndices.includes(i);

                  // A. Faded Paragraph (Disappeared to eliminate distraction)
                  if (isFaded) {
                    return (
                      <div
                        key={i}
                        className="transition-all duration-700 ease-out"
                      >
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-500 hover:bg-slate-100/70 transition-colors">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              [{getParaLabel(i)}] Paragraf o‘qildi va yashirildi
                            </span>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              (diqqatni jamlash uchun o‘chirilgan)
                            </span>
                          </div>
                          <button
                            onClick={() => togglePeek(i)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline decoration-dotted flex items-center gap-1 px-2 py-0.5 rounded hover:bg-teal-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPeeking ? 'Qayta yashirish' : 'Bir zum ko‘rish'}</span>
                          </button>
                        </div>
                        {isPeeking && (
                          <div className={`mt-2 p-4 bg-teal-50/40 border border-teal-200 rounded-xl text-slate-800 ${fontSizeClass} animate-fadeIn`}>
                            {para}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // B. Active Current Paragraph (Supreme Focus Card)
                  if (isCurrent) {
                    const isLastPara = i === paragraphs.length - 1;
                    return (
                      <div
                        key={i}
                        className="p-5 bg-white border-2 border-teal-500 rounded-2xl shadow-sm space-y-4 ring-4 ring-teal-50/60 transition-all duration-500"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-teal-600 text-white font-bold text-xs rounded-md tracking-wider shadow-2xs">
                              PARAGRAF [{getParaLabel(i)}]
                            </span>
                            <span className="text-xs font-semibold text-teal-900">
                              Hozir o‘qilayotgan qism ({i + 1} / {paragraphs.length})
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            Fokus Markazi
                          </span>
                        </div>

                        {/* Paragraph Text */}
                        <p className={`text-slate-900 font-serif ${fontSizeClass}`}>
                          {para}
                        </p>

                        {/* Bottom Actions for Current Paragraph */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-500">
                            Ushbu qismni to‘liq tushundingizmi?
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={markCurrentParagraphAsRead}
                              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
                            >
                              <span>
                                {isLastPara
                                  ? 'Matnni tugatish va Asl holiga qaytarish ✓'
                                  : 'O‘qib bo‘ldim (Keyingi qism) ➔'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // C. Upcoming Paragraph (Hidden/Masked to prevent confusion)
                  if (isUpcoming) {
                    return (
                      <div
                        key={i}
                        className="p-4 bg-slate-50/60 border border-slate-200/60 rounded-xl text-center space-y-1 opacity-70"
                      >
                        <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>[{getParaLabel(i)}] Paragraf — Oldingi qism o‘qilgach ochiladi</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          Chalkashmaslik uchun diqqatingizni yuqoridagi joriy paragrafga qarating.
                        </p>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* All Paragraphs Finished Celebration & Full Restore Action */}
                {isAllRead && (
                  <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl shadow-sm space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5 text-base font-bold">
                      <Award className="w-6 h-6 text-amber-300 shrink-0" />
                      <span>Matn to‘liq o‘qib chiqildi va tushunildi!</span>
                    </div>
                    <p className="text-xs text-teal-100 leading-relaxed">
                      Ajoyib natija! Barcha paragraflar diqqat bilan o‘qildi. Endi o‘ng tarafdagi savollarni ishlashga o‘tishingiz mumkin. Matndagi dalillarni tez topish va qidirish uchun quyidagi tugmani bosib matnni to‘liq ochishingiz mumkin:
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={restoreFullText}
                        className="px-4 py-2 bg-white text-teal-800 font-bold text-xs rounded-xl hover:bg-teal-50 transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4 text-teal-600" />
                        <span>Matnni To‘liq Ko‘rish (Asl Holati)</span>
                      </button>
                      <button
                        onClick={restartFocusMode}
                        className="px-4 py-2 bg-teal-700/60 hover:bg-teal-700 text-white text-xs rounded-xl transition-colors border border-teal-400/40"
                      >
                        Fokusli o‘qishni qaytadan boshlash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CLASSIC FULL TEXT VIEW (100% RESTORED) */}
            {readingMode === 'classic' && (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Matn to‘liq asl holiga qaytarildi. Savollarga javob topish uchun qulay ko‘rinishda.</span>
                  </div>
                  <button
                    onClick={restartFocusMode}
                    className="text-xs font-bold text-teal-800 hover:text-teal-950 underline decoration-dotted shrink-0"
                  >
                    Fokusli o‘chish rejimiga qaytish
                  </button>
                </div>

                <div className="space-y-4">
                  {paragraphs.map((para, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors"
                    >
                      <span className="inline-block px-2.5 py-0.5 bg-slate-200 text-slate-800 font-bold text-xs rounded-md mr-2.5 mb-1">
                        [{getParaLabel(i)}]
                      </span>
                      <p className={`inline text-slate-800 font-serif ${fontSizeClass}`}>
                        {para}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Questions & Navigator (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/70 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Quick Context Banner: If user is working on questions while in Focus Mode */}
            {readingMode === 'focus_disappear' && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-medium">
                    Savolga javob izlayotganda matnni to‘liq ko‘rmoqchimisiz?
                  </span>
                </div>
                <button
                  onClick={restoreFullText}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-2xs"
                >
                  Asl holiga qaytarish
                </button>
              </div>
            )}

            {/* Question Quick Jump Pills */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Savollarga tezkor o‘tish:
              </div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isCurrent = currentQuestionIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all tabular-nums ${
                        isCurrent
                          ? 'bg-teal-600 text-white shadow-xs'
                          : isAnswered
                          ? 'bg-teal-50 text-teal-800 border border-teal-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Body */}
            {currentQ && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-700">
                    Savol {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <span className="capitalize">{currentQ.question_type.replace(/_/g, ' ')}</span>
                </div>

                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {currentQ.question_text}
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  {currentQ.options && currentQ.options.length > 0 ? (
                    currentQ.options.map((opt, i) => {
                      const isSelected = userAnswers[currentQ.id] === opt;
                      return (
                        <label
                          key={i}
                          onClick={() => handleAnswerChange(currentQ.id, opt)}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-900 font-medium shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-xs leading-relaxed">{opt}</span>
                        </label>
                      );
                    })
                  ) : (
                    <input
                      type="text"
                      placeholder="Javobingizni yozing..."
                      value={userAnswers[currentQ.id] || ''}
                      onChange={e => handleAnswerChange(currentQ.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Question Stepper */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingi</span>
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Keyingi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Topshirish ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
