import React, { useState } from 'react';
import { api } from '../lib/api';
import { Target, Calendar, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentLevel, setCurrentLevel] = useState('B2');
  const [targetBand, setTargetBand] = useState<number>(7.5);
  const [examDate, setExamDate] = useState('2026-12-20');
  const [studyHours, setStudyHours] = useState<number>(2);
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intensive'>('intensive');

  // Diagnostic mini-questions
  const [readingAns, setReadingAns] = useState<string>('');
  const [listeningAns, setListeningAns] = useState<string>('');
  const [writingConfidence, setWritingConfidence] = useState<string>('B2');

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmitDiagnostic = async () => {
    setIsLoading(true);
    try {
      const readingScore = readingAns === 'B' ? 7.0 : 6.0;
      const listeningScore = listeningAns === 'A' ? 7.0 : 6.0;

      await api.submitDiagnostic({
        current_level: currentLevel,
        target_band: targetBand,
        exam_date: examDate,
        study_hours: studyHours,
        intensity: intensity,
        reading_diag: readingScore,
        listening_diag: listeningScore,
      });

      onComplete();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
              {step === 1 ? '1-Bosqich: Maqsad va Vaqt Taqsimoti' : '2-Bosqich: Tezkor Diagnostika'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Qadam {step} / 2
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {step === 1 ? 'IELTS Tayyorgarlik Maqsadlaringiz' : 'Ko‘nikmalar Diagnostikasi'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sun'iy intellekt darslar va xatolar tahlilini sizning shaxsiy maqsadingizga moslashtiradi.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-teal-600" />
                  Maqsadli IELTS Band Bali
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[6.0, 6.5, 7.0, 7.5, 8.0].map(band => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setTargetBand(band)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        targetBand === band
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {band.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-teal-600" />
                    Hozirgi Taxminiy Darajangiz
                  </label>
                  <select
                    value={currentLevel}
                    onChange={e => setCurrentLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="B1">B1 (Intermediate - 5.0 - 5.5)</option>
                    <option value="B2">B2 (Upper-Intermediate - 6.0 - 6.5)</option>
                    <option value="C1">C1 (Advanced - 7.0 - 8.0)</option>
                    <option value="Unknown">Aniq bilmayman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    Rejalashtirilgan Imtihon Sanasi
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Kuniga Ajratiladigan Vaqt
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setStudyHours(hours)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                        studyHours === hours
                          ? 'bg-teal-50 text-teal-800 border-teal-500 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {hours} soat / kun
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  O‘rganish Intensivligi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'moderate', 'intensive'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setIntensity(mode)}
                      className={`py-2 text-xs capitalize rounded-lg border transition-all ${
                        intensity === mode
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {mode === 'light' ? 'Sekin-asta' : mode === 'moderate' ? 'O‘rtacha' : 'Intensiv'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Eslatma:</strong> IELTS AI Mentor rasmiy imtihon markazlari (British Council, IDP) o‘rnini bosmaydi va kafolatlangan bal va’da qilmaydi; tizim shaxsiy o‘quv samaradorligingizni oshirishga xizmat qiladi.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Keyingi: Diagnostika Savollariga O‘tish →
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-bold text-slate-800 mb-1">
                    1. Reading & Paraphrasing:
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    "The study <span className="font-semibold text-slate-900 underline">corroborates</span> previous empirical findings." Ushbu gapda "corroborates" so‘zining eng yaqin ma’nosi:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'A', text: 'A) Contradicts and refutes' },
                      { key: 'B', text: 'B) Confirms and supports with evidence' },
                      { key: 'C', text: 'C) Ignores completely' }
                    ].map(opt => (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                          readingAns === opt.key ? 'bg-teal-50 border-teal-500 text-teal-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="readingAns"
                          checked={readingAns === opt.key}
                          onChange={() => setReadingAns(opt.key)}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-bold text-slate-800 mb-1">
                    2. Writing & Grammar:
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Qaysi gap IELTS Academic Writing Task 2 uchun eng rasmiy va xatosiz uslub hisoblanadi?
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'A', text: 'A) Seldom do researchers witness such unprecedented economic growth.' },
                      { key: 'B', text: 'B) People always don’t see that much big money coming.' },
                      { key: 'C', text: 'C) Seldom researchers witness big economic jumps.' }
                    ].map(opt => (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                          listeningAns === opt.key ? 'bg-teal-50 border-teal-500 text-teal-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="listeningAns"
                          checked={listeningAns === opt.key}
                          onChange={() => setListeningAns(opt.key)}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  ← Orqaga
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSubmitDiagnostic}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? 'Shaxsiy Reja Tuzilmoqda...' : 'Rejani Shakllantirish va Boshlash ✓'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
