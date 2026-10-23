import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, User, LogOut, ShieldCheck, Flame } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { profile, logout, switchToDemoStudent, switchToAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2.5 text-left text-slate-900 focus:outline-none group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            iM
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            IELTS AI Mentor
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab(profile ? 'dashboard' : 'landing')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-600 ${
              currentTab === 'dashboard' || currentTab === 'landing' ? 'text-teal-600 font-semibold' : ''
            }`}
          >
            {profile ? 'Boshqaruv Paneli' : 'Asosiy'}
          </button>

          <button
            onClick={() => onSelectTab('skills')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-600 ${
              currentTab === 'skills' || currentTab === 'reading' || currentTab === 'listening' || currentTab === 'writing' || currentTab === 'speaking' ? 'text-teal-600 font-semibold' : ''
            }`}
          >
            4 Ta Ko‘nikma
          </button>

          <button
            onClick={() => onSelectTab('vocabulary')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-600 ${
              currentTab === 'vocabulary' ? 'text-teal-600 font-semibold' : ''
            }`}
          >
            Lug‘at & Spaced Repetition
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-600 ${
              currentTab === 'analytics' ? 'text-teal-600 font-semibold' : ''
            }`}
          >
            Xatolar Tahlili
          </button>

          <button
            onClick={() => onSelectTab('tutor')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-600 ${
              currentTab === 'tutor' ? 'text-teal-600 font-semibold' : ''
            }`}
          >
            AI Ustoz Chat
          </button>

          {profile?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-indigo-600 flex items-center gap-1.5 ${
                currentTab === 'admin' ? 'text-indigo-600 font-semibold' : 'text-indigo-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary action & student profile */}
        <div className="flex items-center gap-3 shrink-0">
          {profile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/70 rounded-md text-amber-800 text-xs font-semibold tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{profile.streak_days} kun</span>
              </div>

              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
                <div className="hidden lg:block text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Maqsad: Band {profile.target_band}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Chiqish"
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Kirish
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Ro‘yxatdan o‘tish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
