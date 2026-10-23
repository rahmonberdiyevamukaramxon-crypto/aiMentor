import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Attempt, ErrorPattern } from '../types';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Calendar,
  RefreshCw
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
        Natijalar tahlili yuklanmoqda...
      </div>
    );
  }

  const skills = [
    { name: 'Reading', band: data?.skill_estimates?.reading || 6.5, icon: BookOpen, color: 'bg-blue-600' },
    { name: 'Listening', band: data?.skill_estimates?.listening || 6.5, icon: Headphones, color: 'bg-indigo-600' },
    { name: 'Writing', band: data?.skill_estimates?.writing || 6.0, icon: PenTool, color: 'bg-emerald-600' },
    { name: 'Speaking', band: data?.skill_estimates?.speaking || 6.5, icon: Mic, color: 'bg-purple-600' }
  ];

  const errors: ErrorPattern[] = data?.error_patterns || [];
  const recentAttempts: Attempt[] = data?.activity?.recent_attempts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            Shaxsiy O‘sish Hisoboti
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Progress Tahlili va Xatolar Statistikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Haqiqiy topshirilgan mashqlardan to‘plangan ma’lumotlar asosida 4 ta IELTS bo‘limi bo‘yicha rivojlanish grafigi.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          Eslatma: Ushbu baholar rasmiy imtihon emas, diagnostik baholash hisoblanadi.
        </div>
      </div>

      {/* 4 Skill Bands Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {skills.map(s => {
          const Icon = s.icon;
          const percentage = Math.min(100, Math.round((s.band / 9.0) * 100));
          return (
            <div key={s.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Icon className="w-4 h-4 text-teal-600" />
                  <span>{s.name}</span>
                </div>
                <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                  Band {s.band.toFixed(1)}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Maksimal: Band 9.0</span>
                <span>{percentage}% o‘zlashtirildi</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Distribution & Recent Attempts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recurring Error Categories (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Takrorlanuvchi Xatolar Tahlili
              </h2>
              <p className="text-xs text-slate-500">
                AI tizimi xatolaringiz sababini tahlil qilib, to‘g‘ri strategiyani ko‘rsatadi
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {errors.length > 0 ? (
              errors.map(err => (
                <div key={err.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 capitalize">
                      {err.skill} · {err.category.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[11px] tabular-nums">
                      {err.count} ta xato
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Tavsiya:</strong> {err.corrective_recommendation}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Oxirgi marta: {new Date(err.latest_occurrence).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Hozircha xatoliklar aniqlanmadi. Testlarni topshirishda davom eting!
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Attempts Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Oxirgi Urinishlar Tarixi
            </h2>
            <p className="text-xs text-slate-500">
              Topshirilgan mashqlar va server vaqtlari
            </p>
          </div>

          <div className="space-y-2.5">
            {recentAttempts.length > 0 ? (
              recentAttempts.map(att => (
                <div key={att.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 capitalize">
                      {att.exercise_id}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(att.started_at).toLocaleDateString()} · {att.status === 'submitted' ? 'Topshirildi' : 'Muddati o‘tgan'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-teal-800 tabular-nums">
                      Band {att.band_estimate ? att.band_estimate.toFixed(1) : '5.5'}
                    </div>
                    {att.score !== undefined && att.total_questions !== undefined && (
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {att.score} / {att.total_questions} to‘g‘ri
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Tarix bo‘sh.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
