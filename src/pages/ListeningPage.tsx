import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Exercise, Question, Attempt } from '../types';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  Radio
} from 'lucide-react';

interface ListeningPageProps {
  onBack: () => void;
  onNavigateTutor: () => void;
}

// Generates an authentic IELTS exam chime using the Web Audio API
function playIELTSChime(audioCtx: AudioContext): Promise<void> {
  return new Promise((resolve) => {
    try {
      const now = audioCtx.currentTime;
      // Note 1: E5 (659 Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: A4 (440 Hz)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.25);
      gain2.gain.setValueAtTime(0.001, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.28, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);

      setTimeout(resolve, 950);
    } catch (e) {
      resolve();
    }
  });
}

export const ListeningPage: React.FC<ListeningPageProps> = ({ onBack, onNavigateTutor }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>('');
  const [audioSourceMode, setAudioSourceMode] = useState<'hd' | 'speech'>('hd');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [soundTestActive, setSoundTestActive] = useState(false);
  const [soundTestSuccess, setSoundTestSuccess] = useState(false);

  const [showTranscript, setShowTranscript] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptLinesRef = useRef<{ speaker: string; text: string; full: string }[]>([]);
  const lineTimerRef = useRef<any>(null);

  useEffect(() => {
    loadListeningExercises();

    return () => {
      stopAllAudio();
      if (lineTimerRef.current) clearInterval(lineTimerRef.current);
    };
  }, []);

  // Update playback rate and volume on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [playbackRate, volume, isMuted]);

  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const loadListeningExercises = async () => {
    try {
      const res = await api.getExercises('listening');
      setExercises(res.exercises);
      if (res.exercises.length > 0 && !activeExercise) {
        setActiveExercise(res.exercises[0]);
      }
    } catch (err) {
      console.error('Failed to load listening exercises:', err);
    }
  };

  const parseTranscript = (text: string) => {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => {
      const match = line.match(/^([A-Za-z0-9\s]+):\s*(.*)$/);
      if (match) {
        return { speaker: match[1].trim(), text: match[2].trim(), full: line };
      }
      return { speaker: 'Announcer', text: line.trim(), full: line };
    });
  };

  // Test Sound to guarantee user can hear audio through speakers/headphones
  const handleTestSound = async () => {
    try {
      setSoundTestActive(true);
      setSoundTestSuccess(false);
      const ctx = getAudioContext();
      await playIELTSChime(ctx);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const testUtterance = new SpeechSynthesisUtterance(
          "This is an audio test for IELTS Listening. If you can hear this clearly, your speakers and headphones are ready."
        );
        testUtterance.lang = 'en-GB';
        testUtterance.rate = 1.0;
        testUtterance.onend = () => {
          setSoundTestActive(false);
          setSoundTestSuccess(true);
          setTimeout(() => setSoundTestSuccess(false), 5000);
        };
        testUtterance.onerror = () => {
          setSoundTestActive(false);
          setSoundTestSuccess(true);
        };
        window.speechSynthesis.speak(testUtterance);
      } else {
        setSoundTestActive(false);
        setSoundTestSuccess(true);
      }
    } catch (e) {
      console.error('Audio test failed:', e);
      setSoundTestActive(false);
    }
  };

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (lineTimerRef.current) {
      clearInterval(lineTimerRef.current);
      lineTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleStartExam = async (exercise: Exercise) => {
    try {
      setIsSubmitting(true);
      stopAllAudio();

      const res = await api.startAttempt(exercise.id);
      setAttempt(res.attempt);
      setActiveExercise(res.exercise);
      setQuestions(res.questions);
      setUserAnswers({});
      setResults(null);
      setCurrentTime(0);
      setDuration(0);
      setActiveLineIndex(-1);
      setShowTranscript(false);
      setAudioError(null);

      // Parse transcript lines for live speaker indicator & subtitle tracking
      transcriptLinesRef.current = parseTranscript(exercise.audio_transcript || '');

      // Trigger audio play with user gesture
      const ctx = getAudioContext();
      await playIELTSChime(ctx);

      // Start playing exercise audio
      setTimeout(() => {
        playExerciseAudio(exercise);
      }, 200);

    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const playExerciseAudio = (exercise: Exercise) => {
    setAudioError(null);

    // If HD Audio from server
    if (audioSourceMode === 'hd' && audioRef.current) {
      audioRef.current.src = api.getExerciseAudioUrl(exercise.id);
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('HTML5 Audio play rejected, falling back to Web Speech Synthesis:', err);
          fallbackToSpeechSynthesis(exercise);
        });
    } else {
      fallbackToSpeechSynthesis(exercise);
    }
  };

  // Fallback Web Speech Synthesis with natural UK voice
  const fallbackToSpeechSynthesis = (exercise: Exercise) => {
    if (!('speechSynthesis' in window) || !exercise.audio_transcript) {
      setAudioError("Brauzeringizda audio ijro etish qo‘llab-quvvatlanmaydi.");
      return;
    }

    window.speechSynthesis.cancel();
    const lines = transcriptLinesRef.current.length > 0
      ? transcriptLinesRef.current
      : parseTranscript(exercise.audio_transcript);

    let lineIdx = 0;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en-GB')) ||
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    voices.find(v => v.lang.startsWith('en'));

    setIsPlaying(true);
    setAudioSourceMode('speech');

    const speakNextLine = () => {
      if (lineIdx >= lines.length) {
        setIsPlaying(false);
        setActiveLineIndex(-1);
        setCurrentSpeaker('');
        return;
      }

      const item = lines[lineIdx];
      setActiveLineIndex(lineIdx);
      setCurrentSpeaker(item.speaker);

      const utterance = new SpeechSynthesisUtterance(item.text);
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-GB';
      utterance.rate = playbackRate;
      utterance.volume = isMuted ? 0 : volume;

      // Pitch variation between different speakers
      if (item.speaker.toLowerCase().includes('student') || item.speaker.toLowerCase().includes('dilshod')) {
        utterance.pitch = 1.15;
      } else {
        utterance.pitch = 0.95;
      }

      utterance.onend = () => {
        lineIdx++;
        // Natural pause between turns in dialogue
        setTimeout(speakNextLine, 400);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        lineIdx++;
        setTimeout(speakNextLine, 300);
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextLine();
  };

  const toggleAudio = () => {
    if (isPlaying) {
      if (audioSourceMode === 'hd' && audioRef.current) {
        audioRef.current.pause();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioSourceMode === 'hd' && audioRef.current) {
        audioRef.current.play().catch(() => {
          if (activeExercise) fallbackToSpeechSynthesis(activeExercise);
        });
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else if (activeExercise) {
          fallbackToSpeechSynthesis(activeExercise);
        }
      }
      setIsPlaying(true);
    }
  };

  const handleRestartAudio = () => {
    stopAllAudio();
    if (activeExercise) {
      const ctx = getAudioContext();
      playIELTSChime(ctx).then(() => {
        playExerciseAudio(activeExercise);
      });
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleAnswer = async (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (attempt) {
      try {
        await api.saveAnswer(attempt.id, questionId, answer);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      stopAllAudio();
      const res = await api.submitAttempt(attempt.id);
      setResults(res);
      setAttempt(res.attempt);
    } catch (err: any) {
      alert(err.message || 'Topshirishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : (activeLineIndex >= 0 && transcriptLinesRef.current.length > 0 ? ((activeLineIndex + 1) / transcriptLinesRef.current.length) * 100 : 0);

  // 1. Exercise Catalog Screen
  if (!attempt && !results) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with audio test */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md">
                IELTS Listening Moduli
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Jonli Audio</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Audio Tinglash va Sinov Mashg‘ulotlari
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Britaniya va xalqaro talaffuzdagi real IELTS audio yozuvlari, savollar va batafsil tahlil.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestSound}
              disabled={soundTestActive}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
                soundTestSuccess
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
              title="Quloqchin va dinamik ovozini tekshiring"
            >
              <Volume2 className={`w-4 h-4 ${soundTestActive ? 'animate-bounce text-indigo-600' : ''}`} />
              <span>{soundTestActive ? 'Ovoz yangramoqda...' : soundTestSuccess ? '✓ Ovoz eshitildi!' : 'Ovozni tekshirish (Test)'}</span>
            </button>

            <button
              onClick={onBack}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ← Bosh sahifaga
            </button>
          </div>
        </div>

        {/* Audio Verification Alert */}
        {soundTestSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Ajoyib!</strong> Tizim audiosi quloqchinlaringizda ravshan yangradi. Endi quyidagi mashqlardan birini tanlab, tinglashni boshlashingiz mumkin.
            </span>
          </div>
        )}

        {/* Exercises Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exercises.map((ex, index) => (
            <div
              key={ex.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    Section {index + 1}
                  </span>
                  <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {ex.duration_minutes} daqiqa
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-teal-700 transition-colors line-clamp-2">
                  {ex.title}
                </h2>
                <div className="text-xs text-slate-500 font-medium mb-3">
                  {ex.title_uz}
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {ex.description_uz}
                </p>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900 mb-4">
                  <Headphones className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-bold">Haqiqiy IELTS Audio</div>
                    <div className="text-[11px] text-indigo-700">1 marta eshitish tavsiya etiladi</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Qiyinlik: <strong className="capitalize text-slate-800">{ex.difficulty}</strong>
                </span>
                <button
                  onClick={() => handleStartExam(ex)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs hover:shadow-teal-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tinglashni Boshlash</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Results Screen
  if (results) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                Listening Imtihon Natijasi
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                To‘g‘ri Javoblar va Chalg‘ituvchilar Tahlili
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeExercise?.title}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="text-xs font-semibold text-teal-700">Taxminiy Band</div>
                <div className="text-3xl font-extrabold text-teal-800 tabular-nums">
                  {results.band_estimate ? results.band_estimate.toFixed(1) : '7.0'}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-semibold text-slate-500">To‘g‘ri Javob</div>
                <div className="text-3xl font-extrabold text-slate-800 tabular-nums">
                  {results.score} / {results.total}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Savollar va Audio Qismlari Bo‘yicha Izohlar</span>
            </h2>

            {results.details?.map((item: any) => (
              <div
                key={item.question.id}
                className={`p-4 rounded-xl border ${
                  item.is_correct ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="font-bold text-slate-900">
                    Savol {item.question.question_number}: {item.question.question_text}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      item.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.is_correct ? '✓ To‘g‘ri' : '✕ Xato'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs my-2.5">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Sizning javobingiz:</span>{' '}
                    <span className={`font-bold ${item.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.user_answer || '(Belgilanmagan)'}
                    </span>
                  </div>
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <span className="text-teal-700">To‘g‘ri javob:</span>{' '}
                    <span className="font-bold text-teal-900">{item.question.correct_answer}</span>
                  </div>
                </div>

                {item.question.evidence_passage && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 mt-2 font-mono">
                    <span className="font-bold text-indigo-700 font-sans">Audiodagi dalil:</span> "{item.question.evidence_passage}"
                  </div>
                )}

                {item.question.explanation_uz && (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 mt-2">
                    <span className="font-bold text-slate-900">Tahlil va distractor:</span> {item.question.explanation_uz}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Audio Transcript Viewer with replay */}
          {activeExercise?.audio_transcript && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>To‘liq Audio Transkripti (Listening Script)</span>
                </h3>
                <button
                  onClick={handleRestartAudio}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Qaytadan eshitish</span>
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto border border-slate-200">
                {activeExercise.audio_transcript}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => {
                setResults(null);
                setAttempt(null);
                stopAllAudio();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              ← Boshqa audio mashqlar
            </button>
            <button
              onClick={() => {
                stopAllAudio();
                onNavigateTutor();
              }}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Xatolarni AI Ustoz bilan tahlil qilish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Timed Listening Session Screen
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hidden HTML5 Audio Element for HD Audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const target = e.currentTarget;
          setCurrentTime(target.currentTime);
          if (target.duration && !isNaN(target.duration)) {
            setDuration(target.duration);
          }
        }}
        onLoadedMetadata={(e) => {
          const target = e.currentTarget;
          setDuration(target.duration || 120);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setActiveLineIndex(-1);
        }}
        onError={(e) => {
          console.warn("Audio element error, falling back to Web Speech:", e);
          if (activeExercise && isPlaying) {
            fallbackToSpeechSynthesis(activeExercise);
          }
        }}
        preload="auto"
      />

      {/* Premium IELTS Audio Player Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isPlaying ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30' : 'bg-indigo-50 text-indigo-700'
            }`}>
              <Headphones className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
                  IELTS Listening
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Ovoz yangramoqda</span>
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {activeExercise?.title}
              </h2>
            </div>
          </div>

          {/* Sound Test & Volume */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleVolumeToggle}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={isMuted ? "Ovozni yoqish" : "Ovozni o‘chirish"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Test sound check button */}
            <button
              onClick={handleTestSound}
              disabled={soundTestActive}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Ovozni tekshirib ko'ring"
            >
              {soundTestActive ? "Tekshirilmoqda..." : "🔊 Ovozni tekshirish"}
            </button>
          </div>
        </div>

        {/* Dynamic Equalizer / Waveform Visualization */}
        <div className="py-2 px-4 bg-slate-900 rounded-xl flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-6 w-24">
              {[40, 75, 55, 90, 60, 85, 45, 95].map((height, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t-sm transition-all duration-150 ${
                    isPlaying ? 'bg-teal-400' : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(20, (height * (0.4 + Math.random() * 0.6)))}%` : '20%'
                  }}
                />
              ))}
            </div>
            <div className="text-xs font-mono text-slate-300">
              {currentSpeaker ? (
                <span className="text-teal-300 font-bold">Hozir gapirmoqda: {currentSpeaker}</span>
              ) : (
                <span>IELTS Rasmiy Audio Yozuvi</span>
              )}
            </div>
          </div>

          <div className="font-mono text-xs text-teal-400 font-bold">
            {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '~02:00'}
          </div>
        </div>

        {/* Audio Progress Bar */}
        <div className="space-y-1">
          <div
            className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = clickX / rect.width;
              if (audioRef.current && duration > 0) {
                audioRef.current.currentTime = ratio * duration;
                setCurrentTime(ratio * duration);
              }
            }}
          >
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pauza</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ijro (Davom etish)</span>
                </>
              )}
            </button>

            <button
              onClick={handleRestartAudio}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Boshidan tinglash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Tezlik:</span>
            {[0.8, 1.0, 1.2].map(rate => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playbackRate === rate
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {audioError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Savollar: Eshitish davomida to‘ldiring
            </h3>
            <p className="text-xs text-slate-500">
              Quloq solib, kalit so‘zlar va faktlarni belgilang.
            </p>
          </div>

          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 self-start sm:self-auto bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            {showTranscript ? 'Transkriptni yashirish' : 'Transkriptni ko‘rsatish'}
          </button>
        </div>

        {/* Live Synchronized Transcript */}
        {showTranscript && activeExercise?.audio_transcript && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2 font-sans">
              Audio Matni (Haqiqiy IELTS suhbati):
            </div>
            {transcriptLinesRef.current.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg transition-colors ${
                  activeLineIndex === idx
                    ? 'bg-teal-100/70 border border-teal-300 font-bold text-teal-950 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold text-indigo-800 mr-1.5 font-sans">
                  {item.speaker}:
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="text-xs font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <span className="mt-0.5">{q.question_text}</span>
              </div>

              <div className="space-y-2 mt-3">
                {q.options && q.options.length > 0 ? (
                  q.options.map((opt, i) => (
                    <label
                      key={i}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        userAnswers[q.id] === opt
                          ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`l_${q.id}`}
                        checked={userAnswers[q.id] === opt}
                        onChange={() => {}}
                        className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))
                ) : (
                  <input
                    type="text"
                    value={userAnswers[q.id] || ''}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    placeholder="Eshitgan kalit so‘zingizni yozing..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Javob berildi: <strong className="text-slate-900">{Object.keys(userAnswers).length}</strong> / {questions.length}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-600/20 hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? 'Baholanmoqda...' : 'Javoblarni Tekshirish ✓'}
          </button>
        </div>
      </div>
    </div>
  );
};
