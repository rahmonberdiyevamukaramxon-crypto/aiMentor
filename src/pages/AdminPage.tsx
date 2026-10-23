import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  BookOpen,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Search
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { profile } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'exercises' | 'audit'>('students');
  const [isLoading, setIsLoading] = useState(true);

  // New Exercise Form
  const [skill, setSkill] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');
  const [title, setTitle] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [passageOrPrompt, setPassageOrPrompt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAdminOverview();
      setOverview(res);
    } catch (err) {
      console.error('Error loading admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !passageOrPrompt.trim()) {
      alert('Iltimos, sarlavha va matn/mavzuni kiriting.');
      return;
    }

    try {
      setIsCreating(true);
      await api.createAdminExercise({
        skill,
        title,
        title_uz: titleUz || title,
        description_uz: descriptionUz,
        passage_or_prompt: passageOrPrompt,
        duration_minutes: durationMinutes,
        difficulty
      });

      setSuccessMsg('Yangi IELTS mashqi muvaffaqiyatli saqlandi va o‘quvchilar bazasiga qo‘shildi!');
      setTitle('');
      setTitleUz('');
      setDescriptionUz('');
      setPassageOrPrompt('');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsCreating(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">
          Ruxsat Etilmagan Hudud
        </h2>
        <p className="text-xs text-slate-500">
          Admin portal faqat o‘qituvchi va ma’murlar uchun himoyalangan.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator & O‘qituvchi Boshqaruvi</span>
          </div>
          <h1 className="text-2xl font-bold">
            IELTS AI Mentor Nazorat Markazi
          </h1>
          <p className="text-xs text-slate-300">
            O‘quvchilar faoliyati, mashqlar kutubxonasi va audit jurnali.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            <div className="text-slate-400">Jami O‘quvchilar</div>
            <div className="text-xl font-bold text-teal-400 tabular-nums">
              {overview?.total_students || 0}
            </div>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            <div className="text-slate-400">Mashqlar Soni</div>
            <div className="text-xl font-bold text-teal-400 tabular-nums">
              {overview?.total_exercises || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'students' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          O‘quvchilar Ro‘yxati ({overview?.students?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'exercises' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Yangi Mashq Qo‘shish
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'audit' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Jurnali
        </button>
      </div>

      {/* Tab 1: Students Roster */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">O‘quvchi</th>
                  <th className="py-3.5 px-4">Yoshi</th>
                  <th className="py-3.5 px-4">Maqsadli Band</th>
                  <th className="py-3.5 px-4">Darajasi</th>
                  <th className="py-3.5 px-4">O‘quv Vaqti</th>
                  <th className="py-3.5 px-4">Streak</th>
                  <th className="py-3.5 px-4">Ro‘yxatdan O‘tgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.students?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.age} yosh
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700">
                      Band {s.target_band?.toFixed(1) || '7.0'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                        {s.current_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                      {Math.round(s.study_minutes / 60)} soat ({s.study_minutes} daq)
                    </td>
                    <td className="py-3.5 px-4 text-amber-700 font-bold tabular-nums">
                      🔥 {s.streak} kun
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Create Exercise Form */}
      {activeTab === 'exercises' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Yangi IELTS Mashqini Yaratish
            </h2>
            <p className="text-xs text-slate-500">
              Reading, Listening, Writing yoki Speaking bo‘limi uchun yangi material kiriting.
            </p>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateExercise} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ko‘nikma Bo‘limi
                </label>
                <select
                  value={skill}
                  onChange={e => setSkill(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taymer Vaqti (Daqiqa)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qiyinlik Darajasi
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="easy">Easy (5.5 - 6.5)</option>
                  <option value="medium">Medium (6.5 - 7.5)</option>
                  <option value="hard">Hard (7.5 - 9.0)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mashq Sarlavhasi (Inglizcha)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: The Future of Quantum Cryptography"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sarlavha (O‘zbekcha tarjimasi)
              </label>
              <input
                type="text"
                value={titleUz}
                onChange={e => setTitleUz(e.target.value)}
                placeholder="Kvant kriptografiyasining kelajagi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tavsif (O‘zbekcha yo‘riqnoma)
              </label>
              <input
                type="text"
                value={descriptionUz}
                onChange={e => setDescriptionUz(e.target.value)}
                placeholder="IELTS Academic Reading Passage 3 standarti bo‘yicha"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Matn yoki Mavzu Topshirig‘i (Passage / Writing Prompt)
              </label>
              <textarea
                rows={8}
                required
                value={passageOrPrompt}
                onChange={e => setPassageOrPrompt(e.target.value)}
                placeholder="Akademik matn yoki insho mavzusi..."
                className="w-full p-3 font-serif border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isCreating ? 'Saqlanmoqda...' : 'Mashqni Bazaga Qo‘shish ✓'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Audit va Xavfsizlik Jurnali
            </h2>
            <p className="text-xs text-slate-500">
              Tizimdagi barcha muhim ma’muriy o‘zgarishlar va kirish voqealari
            </p>
          </div>

          <div className="space-y-2">
            {overview?.recent_audit?.map((item: any) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{item.action}</span> ·{' '}
                  <span className="text-slate-600">{item.details}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
