import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RefreshCw,
  Lightbulb,
  BookOpen,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export const AITutorPage: React.FC<{ onNavigateSkill: (skill: string) => void }> = ({ onNavigateSkill }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      const res = await api.getChatHistory();
      if (res && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
        return;
      }
    } catch {
      // Graceful fallback without throwing or logging error
    }

    // Default welcome message from tutor
    setMessages([
      {
        id: 'welcome-1',
        profile_id: profile?.id || 'demo',
        role: 'assistant',
        content: `Assalomu alaykum, ${profile?.first_name || 'o‘quvchi'}! Men sizning shaxsiy IELTS AI Mentor ustozingizman.\n\nSizning maqsadingiz: Band ${profile?.target_band || 7.5}. Men sizga Reading, Listening, Writing va Speaking bo‘yicha har qanday savolingizga javob beraman, xatolaringizni tahlil qilaman va eng samarali strategiyalarni o‘rgataman.\n\nBugun qaysi mavzudan boshlaymiz?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    const userMsgId = String(Date.now());
    const tempUserMsg: ChatMessage = {
      id: userMsgId,
      profile_id: profile?.id || 'demo',
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const assistantMsgId = String(Date.now() + 1);
    const tempAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      profile_id: profile?.id || 'demo',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsLoading(true);

    let accumulatedContent = '';

    await api.streamTutor(
      text,
      undefined,
      (chunk: string) => {
        accumulatedContent += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
          )
        );
      },
      () => {
        setIsLoading(false);
      },
      async (streamErr) => {
        console.warn('Stream failed, falling back to unary fetch:', streamErr);
        try {
          const res = await api.chatTutor(text);
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: res.reply.content } : m
            )
          );
        } catch {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      `Assalomu alaykum, ${profile?.first_name || 'talaba'}!\n\nSavolingiz: "${text}".\n\nIELTS strategiyasi:\nIELTS da har bir ko‘nikmada vaqtni to‘g‘ri taqsimlash va savol kalit so‘zlarini parafraza qilish muvaffaqiyat garovidir. Mashqlarni davom ettiring!`,
                  }
                : m
            )
          );
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const suggestions = [
    "Readingda True/False/Not Given ni qanday aniq farqlayman?",
    "Writing Task 2 uchun Band 7.0+ PEEL strukturasi qanday tuziladi?",
    "Speaking Part 2 da pauzalarni yo‘qotish bo‘yicha 3 ta amaliy maslahat bering",
    "Akademik insho uchun 5 ta eng muhim C1 darajadagi bog‘lovchi so‘zlar"
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              IELTS Shaxsiy AI Ustoz
            </h1>
            <p className="text-xs text-slate-500">
              Pedagogik tushuntirishlar, xatolar tahlili va amaliy misollar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-md font-semibold">
            Maqsad: Band {profile?.target_band || 7.5}
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 lg:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-teal-600 text-white'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-tr-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs font-normal'
              }`}
            >
              {msg.content || (
                <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                  <span>Ustoz javob yozmoqda</span>
                  <span className="animate-pulse tracking-widest">...</span>
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
        <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Tezkor savollar:
        </span>
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap shrink-0 transition-colors border border-slate-200/60"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white rounded-xl border border-slate-200 p-2 flex items-center gap-2 shadow-xs shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder="IELTS bo‘yicha savolingizni yozing (masalan: Task 2 insho xatolarimni qanday to‘g‘rilay?)..."
          className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent text-slate-900"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
