import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { LearningPlan, Attempt, Reward, ErrorPattern } from '../types';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Flame,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, meta?: any) => void;
  onOpenDiagnostic: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenDiagnostic }) => {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [planRes, analyticsRes] = await Promise.all([
        api.getPlan(),
        api.getAnalytics()
      ]);
      setPlan(planRes.plan);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profile?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
        <span className="text-xs">Ma’lumotlar yuklanmoqda...</span>
      </div>
    );
  }

  const skills = [
    { key: 'reading', label: 'Reading', band: analytics?.skill_estimates?.reading || 6.5, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { key: 'listening', label: 'Listening', band: analytics?.skill_estimates?.listening || 6.5, icon: Headphones, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'writing', label: 'Writing', band: analytics?.skill_estimates?.writing || 6.0, icon: PenTool, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'speaking', label: 'Speaking', band: analytics?.skill_estimates?.speaking || 6.5, icon: Mic, color: 'text-purple-600 bg-purple-50' },
  ];

  const targetBand = profile?.target_band || 7.5;
  const streak = profile?.streak_days || 1;
  const studyMins = profile?.total_study_minutes || 0;
  const studyHours = (studyMins / 60).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
            Shaxsiy O‘quv Xonasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Xush kelibsiz, {profile?.first_name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            Bugungi maqsadingiz: Band <span className="font-bold text-slate-900">{targetBand}</span>. Doimiy intizom va xatolar ustida ishlash orqali natijangizni oshiring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('reading')}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span>O‘qishni Davom Ettirish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenDiagnostic}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            Maqsadni Yangilash
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>O‘quv Davomiyligi</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {streak} <span className="text-xs font-normal text-slate-500">kun</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Uzluksiz faollik
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Umumiy Vaqt</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {studyHours} <span className="text-xs font-normal text-slate-500">soat</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Jami {studyMins} daqiqa mashq
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Aniqlik Ko‘rsatkichi</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {analytics?.activity?.accuracy_percentage || 75}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.activity?.completed_attempts || 1} ta mashq topshirildi
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Maqsadli Band</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {targetBand.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Daraja: {profile?.current_level || 'B2'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Today's Plan vs Estimated Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Today's Plan & Objectives */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bugungi O‘quv Rejasi
                </h2>
                <p className="text-xs text-slate-500">
                  AI Mentor tomonidan sizning zaif jihatlaringiz asosida tuzilgan
                </p>
              </div>
              <button
                onClick={() => onNavigate('skills')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Barcha darslar →
              </button>
            </div>

            <div className="space-y-3">
              {plan?.daily_objectives && plan.daily_objectives.length > 0 ? (
                plan.daily_objectives.map((obj, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (obj.skill === 'reading') onNavigate('reading');
                      else if (obj.skill === 'writing') onNavigate('writing');
                      else if (obj.skill === 'speaking') onNavigate('speaking');
                      else if (obj.skill === 'listening') onNavigate('listening');
                      else if (obj.skill === 'vocabulary') onNavigate('vocabulary');
                      else onNavigate('grammar');
                    }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      obj.completed
                        ? 'bg-slate-50/70 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-teal-500/50 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          obj.completed ? 'bg-teal-600 text-white' : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          {obj.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {obj.day} · {obj.duration_min} daqiqa · <span className="capitalize">{obj.skill}</span>
                        </div>
                      </div>
                    </div>

                    <button className="text-xs font-medium text-teal-700 hover:underline shrink-0">
                      {obj.completed ? 'Qayta ko‘rish' : 'Bajarish'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Kunlik reja mavjud emas. Diagnostikani topshiring.
                </div>
              )}
            </div>
          </div>

          {/* Weak Skills & Recommended Corrective Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Zaif Jihatlar va Tavsiya Etilgan Mashqlar
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Oldingi urinishlaringizdagi xatolarga asoslangan tuzatish tavsiyalari
            </p>

            <div className="space-y-3">
              {analytics?.error_patterns && analytics.error_patterns.length > 0 ? (
                analytics.error_patterns.slice(0, 3).map((err: ErrorPattern, i: number) => (
                  <div key={i} className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-lg">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
                      <span className="capitalize">{err.skill} · {err.category.replace('_', ' ')}</span>
                      <span className="text-[11px] font-normal text-amber-700 tabular-nums">
                        {err.count} marta uchragan
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {err.corrective_recommendation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                  Hozircha tizimda qayd etilgan xato yo‘q. Yangi mashqlarni topshirib bilimingizni sinang!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Estimated Skill Bands & Badges */}
        <div className="lg:col-span-5 space-y-6">
          {/* Skill Estimates Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ko‘nikmalar Bo‘yicha Baholash
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real topshirilgan testlar natijalariga asoslangan baholash
            </p>

            <div className="space-y-4">
              {skills.map(s => {
                const Icon = s.icon;
                const percentage = Math.min(100, Math.round((s.band / 9.0) * 100));
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${s.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800">{s.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        Band {s.band.toFixed(1)} / 9.0
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Umumiy Taxminiy Band:</span>
              <span className="text-sm font-extrabold text-teal-700 tabular-nums">
                Band {analytics?.skill_estimates?.overall || 6.5}
              </span>
            </div>
          </div>

          {/* Quick AI Tutor Ask Box */}
          <div className="bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-200/60 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs mb-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>IELTS AI Ustozdan Maslahat Oling</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Inshoning strukturasini qanday boshlash, Readingda vaqtni tejash yoki Speaking Part 2 da pauzalarni yo‘qotish bo‘yicha savol bering.
            </p>
            <button
              onClick={() => onNavigate('tutor')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-teal-300 text-teal-800 font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>AI Ustoz Bilan Suhbatlashish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Earned Rewards Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Erishilgan Yutuqlar
              </h2>
              <button
                onClick={() => onNavigate('rewards')}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Barchasi →
              </button>
            </div>

            <div className="space-y-2.5">
              {analytics?.rewards && analytics.rewards.length > 0 ? (
                analytics.rewards.slice(0, 2).map((sr: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                      🏆
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {sr.reward?.name_uz || 'Birinchi Qadam'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        +{sr.reward?.points || 50} ball to‘plandi
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">
                  Birinchi mashqingizni topshirib nishonni qo‘lga kiriting!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
