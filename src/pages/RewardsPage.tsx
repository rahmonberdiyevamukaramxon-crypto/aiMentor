import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Reward } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';

export const RewardsPage: React.FC = () => {
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const res = await api.getRewards();
      setRewards(res.rewards);
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const streak = profile?.streak_days || 1;
  const totalPoints = rewards.filter(r => r.is_earned).reduce((acc, r) => acc + r.points, 0);

  const motivationalQuotes = [
    "Ajoyib! Bugun oldingi natijangizni yaxshiladingiz.",
    "Xatolaringizni tahlil qilish orqali rivojlanyapsiz. Davom eting!",
    "Siz maqsadingizga yaqinlashyapsiz. Keyingi mashqni ham topshiring!",
    "Bu safar vaqtni yaxshiroq boshqardingiz. Barakalla!"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Streak & Points */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            Intizom va Rag‘batlantirish Tizimi
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Yutuqlar va O‘quv Davomiyligi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Har bir muvaffaqiyatli topshirilgan mashq, haftalik faollik va o‘rganilgan yangi lug‘atlar uchun yutuq nishonlari bilan taqdirlanasiz.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Streak</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-900 tabular-nums">
              {streak} <span className="text-xs font-normal">kun</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Jami Ball</span>
            </div>
            <div className="text-2xl font-extrabold text-teal-900 tabular-nums">
              {totalPoints} <span className="text-xs font-normal">ball</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Uzbek Messages Carousel/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {motivationalQuotes.map((quote, idx) => (
          <div
            key={idx}
            className="p-4 bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-100 rounded-xl flex items-center gap-3 text-xs text-teal-900 font-medium shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <p>"{quote}"</p>
          </div>
        ))}
      </div>

      {/* Rewards Catalog Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          IELTS Akademik Nishonlar (Badges)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rewards.map(reward => {
            const isEarned = reward.is_earned;
            return (
              <div
                key={reward.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isEarned
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                        isEarned ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isEarned ? '🏆' : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    <span className="text-xs font-bold text-amber-800 px-2 py-0.5 bg-amber-50 rounded">
                      +{reward.points} ball
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {reward.name_uz}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {reward.description_uz}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 text-xs">
                  {isEarned ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Qo‘lga kiritildi!</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      Vazifa: {reward.criteria_value} ta mashq topshirish
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
