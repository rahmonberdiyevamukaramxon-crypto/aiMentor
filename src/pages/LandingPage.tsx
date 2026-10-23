import React from 'react';
import { BookOpen, Headphones, PenTool, Mic, ArrowRight, CheckCircle2, Shield, Sparkles, Brain, Award } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onSelectSkill: (skill: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSelectSkill }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
                O‘zbekistondagi Talabalar Uchun Shaxsiy Sun’iy Intellekt Tizimi
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                IELTS 7.5+ Bandiga Moslashuvchan va Tizimli Tayyorgarlik
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                IELTS AI Mentor barcha 4 ko‘nikmani (Reading, Listening, Writing, Speaking) qamrab oladi. Har bir topshirilgan insho va og‘zaki nutqingizni xalqaro IELTS baholash mezonlari (TR, CC, LR, GRA) asosida soniyalarda tekshiradi va zaif jihatlaringizga doir maxsus mashqlar belgilaydi.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onStart}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                >
                  <span>Diagnostikani Boshlash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectSkill('reading')}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Sinov Mashqlarini Ko‘rish
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-6 text-xs text-slate-500">
                <div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">4 Ta</div>
                  <div>To‘liq IELTS Ko‘nikmalari</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">100%</div>
                  <div>Server Nazoratidagi Taymer</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">O‘zbekcha</div>
                  <div>Tushunarli Pedagogik Tahlil</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 aspect-16/10 lg:aspect-auto lg:h-[420px]">
                <img
                  src="/src/assets/images/hero_ielts_mentor_1792765908504.jpg"
                  alt="IELTS AI Mentor o‘quv muhiti"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core IELTS Skills Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            IELTS Imtihonining 4 Asosiy Yo‘nalishi
          </h2>
          <p className="text-sm text-slate-600">
            Har bir modul rasmiy Cambridge standartlari asosida tuzilgan va real vaqtda javoblarni tekshirish imkoniyatiga ega.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Reading */}
          <div
            onClick={() => onSelectSkill('reading')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              <img
                src="/src/assets/images/reading_module_cover_1792765908538.jpg"
                alt="IELTS Reading moduli"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Reading Moduli</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  Akademik Matnlar va T/F/NG
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  20-daqiqalik qat'iy taymer, parafraza tahlili, xato qilingan savolning matndagi isboti (evidence) bilan ta'minlanadi.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Mashqni Boshlash</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Listening */}
          <div
            onClick={() => onSelectSkill('listening')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              <img
                src="/src/assets/images/listening_module_cover_1792765909453.jpg"
                alt="IELTS Listening moduli"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
                  <Headphones className="w-4 h-4" />
                  <span>Listening Moduli</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  Audio Qabul va Form Completion
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Raqamlar, ismlar, distractor (chalg‘ituvchi) iboralarni ajratish hamda interaktiv transkript orqali eshitish qobiliyatini o‘stirish.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Mashqni Boshlash</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Writing */}
          <div
            onClick={() => onSelectSkill('writing')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              <img
                src="/src/assets/images/writing_module_cover_1792765910193.jpg"
                alt="IELTS Writing moduli"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
                  <PenTool className="w-4 h-4" />
                  <span>Writing Moduli</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  Task 1 & Task 2 AI Baholash
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  So‘zlar hisobi, avtosaqlash, IELTS kriteriyalari bo‘yicha batafsil baholash va Band 8.5 darajasidagi namunaviy variant.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Insho Yozish</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Speaking */}
          <div
            onClick={() => onSelectSkill('speaking')}
            className="group bg-white rounded-xl border border-slate-200 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              <img
                src="/src/assets/images/speaking_module_cover_1792765909561.jpg"
                alt="IELTS Speaking moduli"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
                  <Mic className="w-4 h-4" />
                  <span>Speaking Moduli</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  1-Daqiqa Reja va Ovozli Yozuv
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real mikrofon yozuvi, nutq ravonligi, so‘z boyligi va ikkilanishlarni tahlil qiluvchi nutq simulyatori.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Nutqni Yozish</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pedagogical Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Spaced Repetition & Xatolar Arxiv
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tizim yo‘l qo‘yilgan har bir xatoni toifalarga ajratadi (e.g. Paraphrase xatosi, Grammatik chalkashlik, Vaqt yetishmasligi) va esdan chiqish ehtimolini hisobga olgan holda takrorlashga beradi.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Server Taymeri va Haqiqiy Sinov
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Faqat brauzer vaqtiga tayanilmaydi: server muddati (deadline) qat'iy nazorat qilinadi. Sahifa yangilanganda ham qolgan vaqt va saqlangan javoblar buzilmaydi.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hurmatli Intizom va Rag‘bat
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kunlik dars davomiyligi (streak), yutuq nishonlari va har bir mashqdan so‘ng iliq o‘zbekcha motivatsion tahlil bilan o‘rganish ishtiyoqi qo‘llab-quvvatlanadi.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
