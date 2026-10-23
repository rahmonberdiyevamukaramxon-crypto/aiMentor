import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User, Calendar, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [pin, setPin] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, login, switchToDemoStudent, switchToAdmin } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const numAge = parseInt(age, 10);
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Ism va familiyangizni kiriting.');
        }
        if (isNaN(numAge) || numAge < 10 || numAge > 99) {
          throw new Error('Yosh 10 dan 99 yoshgacha bo‘lishi shart.');
        }
        if (!/^\d{4,6}$/.test(pin)) {
          throw new Error('PIN-kod 4 yoki 6 xonali raqam bo‘lishi lozim.');
        }
        await register(firstName, lastName, numAge, pin);
      } else {
        if (!pin) {
          throw new Error('PIN-kodni kiriting.');
        }
        if (studentId.trim()) {
          await login({ student_id: studentId.trim(), pin });
        } else if (firstName.trim() && lastName.trim()) {
          await login({ first_name: firstName.trim(), last_name: lastName.trim(), pin });
        } else {
          throw new Error('Talaba ID raqami yoki Ism va Familiyangizni kiriting.');
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoStudent = async () => {
    try {
      setIsSubmitting(true);
      await switchToDemoStudent();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAdmin = async () => {
    try {
      setIsSubmitting(true);
      await switchToAdmin();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'register' ? 'Yangi Talaba Ro‘yxati' : 'Tizimga Kirish'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'register'
                ? 'IELTS AI Mentor profilingizni yarating'
                : 'Shaxsiy PIN-kodingiz orqali profilingizga kiring'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          {mode === 'register' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ism
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Masalan: Sardor"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Familiya
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Masalan: Alimov"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yoshingiz (10 - 99)
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={99}
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="21"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shaxsiy Xavfsizlik PIN-kodi (4-6 raqam)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Har safar kirishda faqat ushbu PIN-kodingiz bilan natijalaringizni ko‘ra olasiz.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ism va Familiya (yoki Talaba ID)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Ism"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Familiya"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div className="text-center text-[11px] text-slate-400 my-1">yoki</div>
                <input
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="Talaba UUID (ixtiyoriy)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN-kod
                </label>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? 'Tekshirilmoqda...'
              : mode === 'register'
              ? 'Profilni Yaratish'
              : 'Profilga Kirish'}
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            {mode === 'register' ? (
              <span>
                Hisobingiz bormi?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-teal-600 hover:underline"
                >
                  Kirish
                </button>
              </span>
            ) : (
              <span>
                Yangi foydalanuvchimisiz?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-semibold text-teal-600 hover:underline"
                >
                  Ro‘yxatdan o‘tish
                </button>
              </span>
            )}
          </div>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Tezkor Test Rejimi
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoStudent}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors text-center"
              >
                🎓 Azizbek (Talaba, PIN: 1234)
              </button>
              <button
                type="button"
                onClick={handleDemoAdmin}
                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-medium transition-colors text-center"
              >
                🛡️ Admin (PIN: 9944)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
