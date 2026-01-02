import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, ChevronDown, ChevronUp, Brain, Download, FileText } from 'lucide-react';
import { SessionData, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';

interface JournalProps {
  language: Language;
}

const Journal: React.FC<JournalProps> = ({ language }) => {
  const [entries, setEntries] = useState<SessionData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuth();
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const saved = localStorage.getItem('neurosignal_journal');
    if (saved && user) {
      const allEntries: SessionData[] = JSON.parse(saved);
      // Filter by current user ID
      setEntries(allEntries.filter(entry => entry.userId === user.id));
    }
  }, [user]);

  const deleteEntry = (id: string) => {
    const allEntries: SessionData[] = JSON.parse(localStorage.getItem('neurosignal_journal') || '[]');
    const updatedAll = allEntries.filter(e => e.id !== id);
    localStorage.setItem('neurosignal_journal', JSON.stringify(updatedAll));
    setEntries(entries.filter(e => e.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-EG', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const exportCSV = (entry: SessionData) => {
    const headers = "Timestamp,Anxiety,Stress,Confidence,Deception\n";
    const rows = entry.timeline.map(t => 
      `${t.timestamp},${t.anxiety.toFixed(2)},${t.stress.toFixed(2)},${t.confidence.toFixed(2)},${t.deception.toFixed(2)}`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `session_${entry.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = (entry: SessionData) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(entry.title || "NeuroSignal Session", 10, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${formatDate(entry.date)}`, 10, 30);
    doc.text(`Duration: ${entry.duration} seconds`, 10, 40);
    doc.text(`User: ${user?.name}`, 10, 50);

    doc.setFontSize(14);
    doc.text("Summary Metrics", 10, 65);
    
    doc.setFontSize(12);
    doc.text(`Anxiety Avg: ${entry.averages.anxiety.toFixed(1)}%`, 10, 75);
    doc.text(`Stress Avg: ${entry.averages.stress.toFixed(1)}%`, 10, 85);
    doc.text(`Confidence Avg: ${entry.averages.confidence.toFixed(1)}%`, 10, 95);
    doc.text(`Deception Indicators: ${entry.averages.deception.toFixed(1)}%`, 10, 105);

    if (entry.userNotes) {
        doc.text("Notes:", 10, 120);
        const splitNotes = doc.splitTextToSize(entry.userNotes, 180);
        doc.text(splitNotes, 10, 130);
    }

    doc.save(`session_${entry.id}.pdf`);
  };

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-2xl font-bold text-primary-400 mb-6 flex items-center gap-2">
        <Brain />
        {t.nav_journal}
      </h2>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Brain className="w-16 h-16 mb-4 opacity-20" />
          <p>{t.no_entries}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-800 p-2 rounded-full text-primary-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{entry.title || 'Untitled Session'}</h3>
                    <p className="text-sm text-slate-400">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-slate-950 rounded-full text-xs font-mono text-primary-400 border border-slate-800">
                    {entry.duration}s
                  </span>
                  {expandedId === entry.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
              </div>

              {expandedId === entry.id && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 mb-1">{t.anxiety}</p>
                      <p className="text-xl font-bold text-red-400">{entry.averages.anxiety.toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 mb-1">{t.stress}</p>
                      <p className="text-xl font-bold text-orange-400">{entry.averages.stress.toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 mb-1">{t.confidence}</p>
                      <p className="text-xl font-bold text-green-400">{entry.averages.confidence.toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 mb-1">{t.deception}</p>
                      <p className="text-xl font-bold text-purple-400">{entry.averages.deception.toFixed(0)}%</p>
                    </div>
                  </div>
                  
                  {/* Mini Chart - Added min-w-0 */}
                  <div className="h-40 mb-4 w-full min-w-0">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={entry.timeline}>
                         <Line type="monotone" dataKey="anxiety" stroke="#ef4444" dot={false} strokeWidth={2} />
                         <Line type="monotone" dataKey="confidence" stroke="#22c55e" dot={false} strokeWidth={2} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} 
                            labelStyle={{ color: '#94a3b8' }}
                          />
                         <XAxis dataKey="timestamp" hide />
                         <YAxis hide domain={[0, 100]} />
                       </LineChart>
                     </ResponsiveContainer>
                  </div>

                  {entry.userNotes && (
                    <div className="mb-4 bg-slate-900 p-3 rounded-lg">
                      <p className="text-sm text-slate-300 italic">"{entry.userNotes}"</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); exportCSV(entry); }}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                            <FileText className="w-3 h-3" />
                            {t.export_csv}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); exportPDF(entry); }}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            {t.export_pdf}
                        </button>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                      className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.delete}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Journal;