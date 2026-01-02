import React, { useState } from 'react';
import { Activity, BookOpen, Brain, Globe, Target, LogOut, User as UserIcon } from 'lucide-react';
import AnalysisDisplay from './components/AnalysisDisplay';
import Library from './components/Library';
import Journal from './components/Journal';
import Login from './components/Login';
import Training from './components/Training';
import { Language } from './types';
import { TRANSLATIONS } from './constants';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'analysis' | 'journal' | 'library' | 'training'>('analysis');
  const [language, setLanguage] = useState<Language>('en');
  const { user, logout, isLoading } = useAuth();

  const t = TRANSLATIONS[language];

  if (isLoading) {
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-primary-500">Loading...</div>;
  }

  if (!user) {
      return <Login language={language} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <nav className="w-16 md:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-8 z-10 flex-shrink-0">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 mb-4">
          <Activity className="text-white w-6 h-6" />
        </div>

        <div className="flex flex-col gap-6 w-full items-center">
          <button
            onClick={() => setCurrentView('analysis')}
            className={`p-3 rounded-xl transition-all ${
              currentView === 'analysis' 
                ? 'bg-slate-800 text-primary-400 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
            title={t.nav_analyze}
          >
            <Activity className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setCurrentView('journal')}
            className={`p-3 rounded-xl transition-all ${
              currentView === 'journal' 
                ? 'bg-slate-800 text-primary-400 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
            title={t.nav_journal}
          >
            <Brain className="w-6 h-6" />
          </button>

          <button
            onClick={() => setCurrentView('training')}
            className={`p-3 rounded-xl transition-all ${
              currentView === 'training' 
                ? 'bg-slate-800 text-primary-400 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
            title={t.nav_training}
          >
            <Target className="w-6 h-6" />
          </button>

          <button
            onClick={() => setCurrentView('library')}
            className={`p-3 rounded-xl transition-all ${
              currentView === 'library' 
                ? 'bg-slate-800 text-primary-400 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
            title={t.nav_library}
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-400 cursor-help" title={user.name}>
             {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => setLanguage(prev => prev === 'en' ? 'ar' : 'en')}
            className="p-3 text-slate-400 hover:text-white transition-colors"
            title="Switch Language"
          >
            <Globe className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase block mt-1">{language}</span>
          </button>
          <button
            onClick={logout}
            className="p-3 text-red-400 hover:text-red-300 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-slate-950">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
         </div>

         <div className="relative z-10 h-full">
            {currentView === 'analysis' && <AnalysisDisplay language={language} />}
            {currentView === 'journal' && <Journal language={language} />}
            {currentView === 'library' && <Library language={language} />}
            {currentView === 'training' && <Training language={language} />}
         </div>
      </main>
    </div>
  );
};

export default App;
