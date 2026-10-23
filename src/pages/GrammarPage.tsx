import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface GrammarQuiz {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  ieltsTip: string;
}

export const GrammarPage: React.FC<{ onNavigateTutor: () => void }> = ({ onNavigateTutor }) => {
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const topics = [
    {
      id: 'inversion',
      title: 'Inversiya (Inversion for Emphasis)',
      level: 'Band 7.5 - 9.0',
      description: 'Salbiy yuklamalar (Rarely, Seldom, Not only, Under no circumstances) bilan gap boshlanib, urg‘u berish usuli.',
      formula: 'Negative Adverb + Auxiliary Verb + Subject + Main Verb',
      examples: [
        'Oddiy: "Researchers rarely observe such correlations."',
        'Inversiya (Band 8+): "Rarely do researchers observe such correlations."',
        'Oddiy: "If governments had taken measures earlier..."',
        'Inversiya (Band 8+): "Had governments taken measures earlier..."'
      ],
      quizzes: [
        {
          question: "Rarely _______ such a comprehensive academic breakthrough in solar energy.",
          options: [
            "A) we have witnessed",
            "B) have we witnessed",
            "C) we witnessed",
            "D) did we witnessed"
          ],
          correct: "B) have we witnessed",
          explanation: "Inkor yuklamasi 'Rarely' bilan boshlanganda Present Perfect da 'have' egadan oldinga o‘tadi: Rarely have we witnessed...",
          ieltsTip: "Writing Task 2 kirish yoki xulosa qismida 1 ta inversiya qo‘llash Grammatical Range (GRA) balini sezilarli darajada oshiradi."
        },
        {
          question: "Under no circumstances _______ candidates bring unauthorized electronic devices into the exam hall.",
          options: [
            "A) should",
            "B) they should",
            "C) ought",
            "D) candidates should"
          ],
          correct: "A) should",
          explanation: "'Under no circumstances' dan so‘ng yordamchi modal fe'l 'should' egadan oldin keladi: Under no circumstances should candidates...",
          ieltsTip: "Rasmiy qoidalar va argumentlarda 'Under no circumstances' juda ta'sirchan chiqadi."
        }
      ]
    },
    {
      id: 'passive',
      title: 'Passiv Konstruksiyalar (Passive Voice in Academic Writing)',
      level: 'Band 7.0 - 8.5',
      description: 'IELTS Writing Task 1 diagramma va jarayonlar (processes) tavsifida obyektivlikni saqlash vositasi.',
      formula: 'Subject + be + Past Participle (V3) (+ by agent)',
      examples: [
        'Faol: "Workers heat the raw glass in a furnace."',
        'Passiv (Akademik): "The raw glass is heated in an industrial furnace to approximately 1500°C."',
        'Faol: "Many people consider climate change to be urgent."',
        'Impersonal Passive (Band 8+): "It is widely considered that climate change requires immediate intervention."'
      ],
      quizzes: [
        {
          question: "Once the tea leaves _______, they are transported directly to the fermentation facility.",
          options: [
            "A) have been harvested",
            "B) have harvested",
            "C) are harvesting",
            "D) harvested"
          ],
          correct: "A) have been harvested",
          explanation: "Choy barglari o‘z-o‘zini termaydi, balki teriladi (Present Perfect Passive: have been harvested).",
          ieltsTip: "Writing Task 1 process savollarida doim passiv nisbatdan foydalaning, shaxsni ko‘rsatish shart emas."
        }
      ]
    },
    {
      id: 'conditionals',
      title: 'Murakkab Shart Gaplar (Conditionals & Mixed Types)',
      level: 'Band 7.0 - 8.0',
      description: 'Gipotetik vaziyatlar, sabab-oqibat zanjiri va kelajakdagi ehtimollarni ilmiy ifodalash.',
      formula: 'If + Past Perfect, would + bare infinitive (Mixed: o‘tmishdagi sababning hozirgi oqibati)',
      examples: [
        'Second Conditional: "If municipal authorities subsidized public transit, fewer commuters would drive."',
        'Third Conditional: "Had the initiative received adequate funding, the biodiversity sanctuary would have survived."',
        'Mixed Conditional: "If the city had invested in flood defenses years ago, streets would not be submerged today."'
      ],
      quizzes: [
        {
          question: "If public transport _______ free of charge, traffic congestion would decrease dramatically.",
          options: [
            "A) is",
            "B) were",
            "C) will be",
            "D) would be"
          ],
          correct: "B) were",
          explanation: "Second Conditional qoidasiga ko‘ra, taxminiy vaziyatda barcha shaxslar uchun 'were' qo‘llanilishi eng rasmiy akademik shakldir.",
          ieltsTip: "Hypothetical yechimlar taklif qilganda Second Conditional eng optimal variant hisoblanadi."
        }
      ]
    }
  ];

  const currentTopic = topics[selectedTopicIndex];

  const handleSelectAnswer = (qIdx: number, opt: string) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            IELTS Grammatika Moduli
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Band 7.0+ Akademik Grammatika
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Insho va og‘zaki nutqda yuqori ball (GRA - Grammatical Range and Accuracy) keltiruvchi ilg‘or strukturalar va testlar.
          </p>
        </div>

        <button
          onClick={onNavigateTutor}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Grammatika bo‘yicha AI Ustozdan so‘rash</span>
        </button>
      </div>

      {/* Topic Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {topics.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTopicIndex(idx);
              setUserAnswers({});
              setShowResults(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedTopicIndex === idx
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Main Split: Lesson Explanation vs Interactive Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lesson Theory & Formula (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
                {currentTopic.level}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                {currentTopic.title}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {currentTopic.description}
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Akademik Formulalar:
            </div>
            <div className="font-mono text-xs font-bold text-slate-900">
              {currentTopic.formula}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800">
              Taqqoslama Misollar (Oddiy vs Band 8.0+):
            </div>
            <div className="space-y-2 text-xs">
              {currentTopic.examples.map((ex, i) => (
                <div key={i} className="p-3 bg-teal-50/50 border border-teal-100 rounded-lg text-slate-800 font-serif">
                  {ex}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Quiz Drill (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Amaliy Mashq va Test
            </h3>
            <p className="text-xs text-slate-500">
              Qoidalarni mustahkamlash uchun to‘g‘ri variantni tanlang
            </p>
          </div>

          <div className="space-y-6">
            {currentTopic.quizzes.map((quiz, qIdx) => {
              const selectedOpt = userAnswers[qIdx];
              const isSubmitted = showResults;
              const isCorrect = selectedOpt === quiz.correct;

              return (
                <div key={qIdx} className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">
                    {qIdx + 1}. {quiz.question}
                  </div>

                  <div className="space-y-2">
                    {quiz.options.map((opt, oIdx) => {
                      const isChosen = selectedOpt === opt;
                      let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                      if (isSubmitted) {
                        if (opt === quiz.correct) btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                        else if (isChosen && !isCorrect) btnStyle = 'bg-rose-50 border-rose-500 text-rose-900';
                      } else if (isChosen) {
                        btnStyle = 'bg-teal-50 border-teal-500 text-teal-900 font-semibold';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={showResults}
                          onClick={() => handleSelectAnswer(qIdx, opt)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className="pt-2 text-xs space-y-1.5">
                      <div className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {isCorrect ? 'To‘g‘ri! ✓' : `Xato. To‘g‘ri javob: ${quiz.correct}`}
                      </div>
                      <div className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        {quiz.explanation}
                      </div>
                      <div className="text-[11px] text-teal-800 italic">
                        💡 IELTS Examiner Maslahati: {quiz.ieltsTip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {!showResults ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(userAnswers).length === 0}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                Javoblarni Tekshirish ✓
              </button>
            ) : (
              <button
                onClick={() => {
                  setUserAnswers({});
                  setShowResults(false);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Qayta Urinish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
