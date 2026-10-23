import React from 'react';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';

interface SkillsOverviewPageProps {
  onSelectSkill: (skill: string) => void;
}

export const SkillsOverviewPage: React.FC<SkillsOverviewPageProps> = ({ onSelectSkill }) => {
  const sections = [
    {
      id: 'reading',
      title: 'IELTS Reading',
      title_uz: 'Akademik O‘qish va Matn Tahlili',
      duration: '60 daqiqa (3 ta passage)',
      questions: '40 ta savol',
      target: 'Band 7.0 - 8.5',
      cover: '/src/assets/images/reading_module_cover_1792765908538.jpg',
      icon: BookOpen,
      color: 'teal',
      questionTypes: [
        'True / False / Not Given',
        'Yes / No / Not Given',
        'Matching Headings',
        'Summary & Sentence Completion',
        'Multiple Choice (A, B, C, D)'
      ],
      strategies: [
        'Skimming (1-2 daqiqada umumiy ma’noni ilg‘ash)',
        'Scanning (kalit so‘z va raqamlarni tez topish)',
        'Parafrazalarni aniqlash va chalg‘ituvchilardan ehtiyot bo‘lish'
      ]
    },
    {
      id: 'listening',
      title: 'IELTS Listening',
      title_uz: 'Eshitish va Detallarni Qayd Qilish',
      duration: '30 daqiqa + 10 daqiqa ko‘chirish',
      questions: '40 ta savol (4 ta section)',
      target: 'Band 7.0 - 8.5',
      cover: '/src/assets/images/listening_module_cover_1792765909453.jpg',
      icon: Headphones,
      color: 'indigo',
      questionTypes: [
        'Form & Note Completion',
        'Multiple Choice & Distractor alerts',
        'Map & Diagram Labelling',
        'Short-answer questions',
        'Sentence Completion'
      ],
      strategies: [
        'Audio boshlanishidan oldin savollarni ko‘zdan kechirish',
        'So‘z chegarasi (No more than TWO words) qoidasiga qat’iy rioya qilish',
        'Spelling va raqamlarni xatosiz yozish'
      ]
    },
    {
      id: 'writing',
      title: 'IELTS Writing',
      title_uz: 'Akademik Insho va Diagramma Tahlili',
      duration: '60 daqiqa (Task 1: 20 daq, Task 2: 40 daq)',
      questions: '2 ta vazifa (150 va 250+ so‘z)',
      target: 'Band 7.0 - 8.0',
      cover: '/src/assets/images/writing_module_cover_1792765910193.jpg',
      icon: PenTool,
      color: 'emerald',
      questionTypes: [
        'Academic Task 1: Grafik, jadval va xaritalar',
        'Task 2: Agree / Disagree inshosi',
        'Task 2: Discuss Both Views & Give Opinion',
        'Task 2: Problem & Solution',
        'Task 2: Advantages & Disadvantages'
      ],
      strategies: [
        'PEEL strukturasi (Point, Explanation, Example, Link)',
        'Akademik kollokatsiyalar va passiv konstruksiyalar',
        'Mantiqiy bog‘lovchi vositalar (Cohesion) dan me’yorda foydalanish'
      ]
    },
    {
      id: 'speaking',
      title: 'IELTS Speaking',
      title_uz: 'Og‘zaki Muloqot va Ravon Nutq',
      duration: '11 - 14 daqiqa (3 ta qism)',
      questions: 'Yuzma-yuz intervyu',
      target: 'Band 7.0 - 8.5',
      cover: '/src/assets/images/speaking_module_cover_1792765909561.jpg',
      icon: Mic,
      color: 'purple',
      questionTypes: [
        'Part 1: Kirish va kundalik mavzulardagi savollar',
        'Part 2: 1-daqiqa tayyorgarlik va 2-daqiqa Cue Card',
        'Part 3: Chuqur tahliliy va falsafiy muhokama'
      ],
      strategies: [
        'Uzoq pauzalar va ikkilanishlarni bartaraf etish',
        'Idiomatik va tabiiy inglizcha iboralarni qo‘llash',
        'Fikrni kengaytirib, sabab va misollar bilan asoslash'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            IELTS 4 Ko‘nikma Xaritasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Har Bir Ko‘nikmani Mukammal O‘zlashtirish
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            IELTS AI Mentor barcha to‘rtala bo‘limni rasmiy Cambridge va British Council mezonlari bo‘yicha o‘rgatadi. Zaif bo‘limingizni tanlang va amaliy mashqqa o‘ting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectSkill('vocabulary')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Lug‘at Bazasi</span>
          </button>
          <button
            onClick={() => onSelectSkill('grammar')}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" />
            <span>Grammatika Darslari</span>
          </button>
        </div>
      </div>

      {/* 4 Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map(sec => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all"
            >
              <div>
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={sec.cover}
                    alt={sec.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-xs flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-teal-600" />
                    <span>{sec.title}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {sec.title_uz}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{sec.duration}</span>
                      <span>·</span>
                      <span>{sec.questions}</span>
                      <span>·</span>
                      <span className="font-semibold text-teal-700">{sec.target}</span>
                    </div>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Savol turlari:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sec.questionTypes.map((qType, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {qType}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Key Strategies */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Asosiy Strategiyalar:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {sec.strategies.map((strat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{strat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => onSelectSkill(sec.id)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{sec.title} Mashqlarini Boshlash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
