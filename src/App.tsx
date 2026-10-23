import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { SkillsOverviewPage } from './pages/SkillsOverviewPage';
import { ReadingPage } from './pages/ReadingPage';
import { ListeningPage } from './pages/ListeningPage';
import { WritingPage } from './pages/WritingPage';
import { SpeakingPage } from './pages/SpeakingPage';
import { AITutorPage } from './pages/AITutorPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { GrammarPage } from './pages/GrammarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RewardsPage } from './pages/RewardsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthModal } from './pages/AuthModal';
import { OnboardingModal } from './pages/OnboardingModal';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  LayoutDashboard,
  Layers,
  Sparkles,
  TrendingUp,
  Award,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

function MainApp() {
  const { profile, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // If student logs in and was on landing, switch to dashboard
  React.useEffect(() => {
    if (profile && currentTab === 'landing') {
      setCurrentTab('dashboard');
    }
  }, [profile]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    if (!profile?.target_band) {
      setOnboardingOpen(true);
    }
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1 pb-16 md:pb-8">
        {currentTab === 'landing' && (
          <LandingPage
            onStart={() => {
              if (profile) setOnboardingOpen(true);
              else handleOpenAuth('register');
            }}
            onSelectSkill={skill => setCurrentTab(skill)}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            onNavigate={tab => setCurrentTab(tab)}
            onOpenDiagnostic={() => setOnboardingOpen(true)}
          />
        )}

        {currentTab === 'skills' && (
          <SkillsOverviewPage
            onSelectSkill={skill => setCurrentTab(skill)}
          />
        )}

        {currentTab === 'reading' && (
          <ReadingPage
            onBack={() => setCurrentTab('dashboard')}
            onNavigateTutor={() => setCurrentTab('tutor')}
          />
        )}

        {currentTab === 'listening' && (
          <ListeningPage
            onBack={() => setCurrentTab('dashboard')}
            onNavigateTutor={() => setCurrentTab('tutor')}
          />
        )}

        {currentTab === 'writing' && (
          <WritingPage
            onBack={() => setCurrentTab('dashboard')}
            onNavigateTutor={() => setCurrentTab('tutor')}
          />
        )}

        {currentTab === 'speaking' && (
          <SpeakingPage
            onBack={() => setCurrentTab('dashboard')}
            onNavigateTutor={() => setCurrentTab('tutor')}
          />
        )}

        {currentTab === 'tutor' && (
          <AITutorPage
            onNavigateSkill={skill => setCurrentTab(skill)}
          />
        )}

        {currentTab === 'vocabulary' && (
          <VocabularyPage />
        )}

        {currentTab === 'grammar' && (
          <GrammarPage
            onNavigateTutor={() => setCurrentTab('tutor')}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsPage />
        )}

        {currentTab === 'rewards' && (
          <RewardsPage />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around text-[10px] font-semibold text-slate-500 shadow-lg">
        <button
          onClick={() => setCurrentTab(profile ? 'dashboard' : 'landing')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'dashboard' || currentTab === 'landing' ? 'text-teal-600' : ''
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Asosiy</span>
        </button>

        <button
          onClick={() => setCurrentTab('skills')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'skills' || currentTab === 'reading' || currentTab === 'writing' || currentTab === 'listening' || currentTab === 'speaking'
              ? 'text-teal-600'
              : ''
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4 Ko‘nikma</span>
        </button>

        <button
          onClick={() => setCurrentTab('tutor')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'tutor' ? 'text-teal-600' : ''
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Ustoz</span>
        </button>

        <button
          onClick={() => setCurrentTab('vocabulary')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'vocabulary' ? 'text-teal-600' : ''
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lug‘at</span>
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`flex flex-col items-center gap-1 ${
            currentTab === 'analytics' ? 'text-teal-600' : ''
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Tahlil</span>
        </button>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Onboarding & Diagnostic Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => setCurrentTab('dashboard')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
