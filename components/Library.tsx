import React, { useState } from 'react';
import { Search, ShieldAlert, Smile, EyeOff, Activity, Mic, BookOpen } from 'lucide-react';
import { LIBRARY_ITEMS, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LibraryProps {
  language: Language;
}

const IconMap: Record<string, React.ReactNode> = {
  ShieldAlert: <ShieldAlert className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
  EyeOff: <EyeOff className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Mic: <Mic className="w-6 h-6" />,
};

const Library: React.FC<LibraryProps> = ({ language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[language];

  const filteredItems = LIBRARY_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold text-primary-400 flex items-center gap-2">
          <BookOpen />
          {t.nav_library}
        </h2>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder={t.library_search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 px-10 text-slate-100 focus:outline-none focus:border-primary-500"
          />
          <Search className={`absolute top-2.5 w-5 h-5 text-slate-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-primary-500/50 transition-colors shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-800 rounded-lg text-primary-400">
                {IconMap[item.iconName] || <Activity />}
              </div>
              <div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  {item.category === 'body' ? t.body_language : t.vocal_cues}
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              {item.description}
            </p>
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
              <span className="text-xs text-primary-400 font-bold block mb-1">
                Psychological Trigger:
              </span>
              <p className="text-xs text-slate-400">
                {item.psychTrigger}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
