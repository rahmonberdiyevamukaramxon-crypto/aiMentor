import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { VocabItem } from '../types';
import {
  Layers,
  Sparkles,
  Volume2,
  CheckCircle2,
  RotateCw,
  Search,
  Filter,
  Brain,
  Award,
  BookOpen
} from 'lucide-react';

export const VocabularyPage: React.FC = () => {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    try {
      setIsLoading(true);
      const res = await api.getVocabulary();
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (vocabId: string, quality: number) => {
    try {
      await api.reviewVocabulary(vocabId, quality);
      await loadVocab();
      setIsFlipped(false);
      if (activeCardIndex < filteredItems.length - 1) {
        setActiveCardIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error recording review:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uzbek_meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.english_definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const topics = Array.from(new Set(items.map(i => i.topic)));
  const currentCard = filteredItems[activeCardIndex] || filteredItems[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            IELTS Academic Lug‘at Bazasi
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Spaced Repetition va Flashcard Tizimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            C1 va C2 darajasidagi akademik so‘zlar, kollokatsiyalar va misollar. Xotirada mustahkam saqlash uchun SuperMemo algoritmi bo‘yicha takrorlanadi.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flashcard Rejimi
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lug‘at Ro‘yxati ({items.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="So‘z yoki o‘zbekcha ma’nosini qidirish..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setActiveCardIndex(0);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => {
              setSelectedTopic('all');
              setActiveCardIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedTopic === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Barchasi
          </button>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => {
                setSelectedTopic(t);
                setActiveCardIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTopic === t
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Interactive Flashcards */}
      {viewMode === 'cards' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {currentCard ? (
            <div className="space-y-4">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[300px] flex flex-col justify-between text-center relative"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                    {currentCard.level} · {currentCard.topic}
                  </span>
                  <span>Kartani ag‘darish uchun bosing ↻</span>
                </div>

                {!isFlipped ? (
                  /* Front: Word & Phonetic */
                  <div className="my-auto space-y-3 py-6">
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {currentCard.word}
                    </div>
                    <div className="font-mono text-sm text-teal-700">
                      {currentCard.phonetic}
                    </div>
                    <div className="text-xs text-slate-400">
                      (O‘zbekcha ma’nosi va ta’rifini ko‘rish uchun kartaga bosing)
                    </div>
                  </div>
                ) : (
                  /* Back: Uzbek meaning, definition, collocations */
                  <div className="my-auto space-y-4 py-4 text-left">
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-semibold">O‘zbekcha Ma’nosi:</div>
                      <div className="text-lg font-bold text-teal-800">
                        {currentCard.uzbek_meaning}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 uppercase font-semibold">English Definition:</div>
                      <p className="text-xs text-slate-700 font-serif leading-relaxed">
                        {currentCard.english_definition}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 uppercase font-semibold">Example Sentence:</div>
                      <p className="text-xs text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        "{currentCard.example_sentence}"
                      </p>
                    </div>

                    {currentCard.collocations && (
                      <div>
                        <div className="text-xs text-slate-400 uppercase font-semibold mb-1">
                          Academic Collocations:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentCard.collocations.map((c, i) => (
                            <span key={i} className="text-[11px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Karta {activeCardIndex + 1} / {filteredItems.length}
                  </span>
                  <span>
                    O‘zlashtirish darajasi: <strong>{currentCard.review?.mastery_level || 0} / 5</strong>
                  </span>
                </div>
              </div>

              {/* Spaced Repetition Self-Assessment Buttons */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-600 text-center">
                  Ushbu so‘zni qanchalik yaxshi eslaysiz? (Spaced Repetition):
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleReview(currentCard.id, 1)}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                  >
                    1 - Qiyin
                  </button>
                  <button
                    onClick={() => handleReview(currentCard.id, 3)}
                    className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200"
                  >
                    3 - Esladim
                  </button>
                  <button
                    onClick={() => handleReview(currentCard.id, 4)}
                    className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors border border-blue-200"
                  >
                    4 - Yaxshi
                  </button>
                  <button
                    onClick={() => handleReview(currentCard.id, 5)}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors border border-emerald-200"
                  >
                    5 - Mukammal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Qidiruv bo‘yicha so‘z topilmadi.
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Full Vocabulary Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">So‘z & Transkripsiya</th>
                  <th className="py-3 px-4">O‘zbekcha Ma’nosi</th>
                  <th className="py-3 px-4">Inglizcha Ta’rifi</th>
                  <th className="py-3 px-4">Daraja</th>
                  <th className="py-3 px-4">Mavzu</th>
                  <th className="py-3 px-4">O‘zlashtirish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.word}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{item.phonetic}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-teal-800">
                      {item.uzbek_meaning}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {item.english_definition}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                        {item.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.topic}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {item.review?.mastery_level || 0} / 5
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
