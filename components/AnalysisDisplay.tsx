import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Save, Activity, Send, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SessionData, EmotionData, FrameSnapshot, ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateSessionInsight } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisProps {
  language: Language;
}

const AnalysisDisplay: React.FC<AnalysisProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionData, setSessionData] = useState<EmotionData[]>([]);
  const [snapshots, setSnapshots] = useState<FrameSnapshot[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Current (Real-time) values
  const [currentMetrics, setCurrentMetrics] = useState<EmotionData>({
    timestamp: 0, anxiety: 0, excitement: 0, deception: 0, confidence: 50, stress: 0
  });

  // Save Modal State
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [adjustments, setAdjustments] = useState({
    anxiety: 0, stress: 0, confidence: 0, deception: 0
  });

  // Start Camera on Mount
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulation Loop
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);

        // Simulate new data point (In a real app, this comes from an ML model)
        const newDataPoint: EmotionData = {
          timestamp: elapsed,
          anxiety: Math.min(100, Math.max(0, currentMetrics.anxiety + (Math.random() - 0.5) * 10)),
          excitement: Math.min(100, Math.max(0, currentMetrics.excitement + (Math.random() - 0.5) * 10)),
          deception: Math.min(100, Math.max(0, currentMetrics.deception + (Math.random() - 0.5) * 5)),
          confidence: Math.min(100, Math.max(0, currentMetrics.confidence + (Math.random() - 0.5) * 8)),
          stress: Math.min(100, Math.max(0, currentMetrics.stress + (Math.random() - 0.5) * 12)),
        };

        setCurrentMetrics(newDataPoint);
        setSessionData(prev => [...prev.slice(-40), newDataPoint]); // Keep last 40 for smooth chart, store full elsewhere if needed

        // Simulate automated snapshot on high triggers
        if (newDataPoint.anxiety > 80 && Math.random() > 0.9) {
          takeSnapshot("High Anxiety");
        }
        if (newDataPoint.deception > 70 && Math.random() > 0.95) {
          takeSnapshot("Deception Hint");
        }

      }, 1000);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isRecording, elapsed, currentMetrics]);

  const takeSnapshot = (trigger: string) => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth / 4; // Low res for thumb
    canvas.height = videoRef.current.videoHeight / 4;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg');
    setSnapshots(prev => [...prev, { id: Date.now().toString(), timestamp: elapsed, imageUrl: url, triggerType: trigger }]);
  };

  const handleStop = () => {
    setIsRecording(false);
    // Calc averages for modal
    const len = sessionData.length || 1;
    const avgs = sessionData.reduce((acc, curr) => ({
      anxiety: acc.anxiety + curr.anxiety,
      stress: acc.stress + curr.stress,
      confidence: acc.confidence + curr.confidence,
      deception: acc.deception + curr.deception,
    }), { anxiety: 0, stress: 0, confidence: 0, deception: 0 });
    
    setAdjustments({
      anxiety: Math.round(avgs.anxiety / len),
      stress: Math.round(avgs.stress / len),
      confidence: Math.round(avgs.confidence / len),
      deception: Math.round(avgs.deception / len),
    });
    setShowSaveModal(true);
  };

  const saveJournalEntry = () => {
    if (!user) return; // Should not happen if auth guarded
    
    const newEntry: SessionData = {
      id: Date.now().toString(),
      userId: user.id,
      date: new Date().toISOString(),
      duration: elapsed,
      timeline: sessionData, // Note: In prod, save full history not just sliced state
      snapshots: snapshots,
      title: saveTitle,
      userNotes: saveNotes,
      averages: {
        anxiety: adjustments.anxiety,
        stress: adjustments.stress,
        confidence: adjustments.confidence,
        deception: adjustments.deception,
        excitement: 0 
      }
    };

    const existing = JSON.parse(localStorage.getItem('neurosignal_journal') || '[]');
    localStorage.setItem('neurosignal_journal', JSON.stringify([newEntry, ...existing]));
    setShowSaveModal(false);
    // Reset
    setSessionData([]);
    setSnapshots([]);
    setElapsed(0);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputMessage, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsAiLoading(true);

    const tempSession: Partial<SessionData> = {
        timeline: sessionData,
        duration: elapsed,
        averages: { 
            anxiety: currentMetrics.anxiety, // Approximation using current for live chat
            stress: currentMetrics.stress,
            confidence: currentMetrics.confidence,
            deception: currentMetrics.deception,
            excitement: currentMetrics.excitement
        }
    };

    const responseText = await generateSessionInsight(userMsg.text, tempSession, messages);
    
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsAiLoading(false);
  };

  return (
    // Main Container: 
    // - Desktop (lg): Flex Row, Overflow Hidden (Chat fixed on right, Main Content scrolls)
    // - Mobile: Block, Overflow Auto (Standard scrolling page)
    <div className="h-full w-full bg-slate-950 block overflow-y-auto lg:flex lg:overflow-hidden custom-scrollbar">
      
      {/* Left Content Area (Video, Gauges, Chart) */}
      <div className="flex-1 flex flex-col gap-4 p-4 lg:overflow-y-auto custom-scrollbar lg:h-full min-h-min">
        
        {/* Top Grid: Video & Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          {/* Video Container */}
          <div className="md:col-span-2 relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-mono animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              {isRecording ? "LIVE ANALYSIS" : "STANDBY"}
            </div>
            <div className="absolute top-4 right-4 bg-slate-900/80 text-primary-400 px-3 py-1 rounded-full text-xs font-mono">
              {new Date(elapsed * 1000).toISOString().substr(11, 8)}
            </div>
          </div>

          {/* Gauges Container */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center gap-4 min-h-[300px] h-full">
            <h3 className="text-primary-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
              <Activity className="w-4 h-4" /> {t.live_tracking}
            </h3>
            
            {[
              { label: t.anxiety, val: currentMetrics.anxiety, color: 'bg-red-500' },
              { label: t.stress, val: currentMetrics.stress, color: 'bg-orange-500' },
              { label: t.confidence, val: currentMetrics.confidence, color: 'bg-green-500' },
              { label: t.deception, val: currentMetrics.deception, color: 'bg-purple-500' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{metric.label}</span>
                  <span>{metric.val.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} transition-all duration-500 ease-out`} 
                    style={{ width: `${metric.val}%` }}
                  ></div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => isRecording ? handleStop() : setIsRecording(true)}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-auto ${
                isRecording 
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50' 
                  : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/20'
              }`}
            >
              {isRecording ? <><Square className="w-4 h-4 fill-current" /> {t.stop_session}</> : <><Play className="w-4 h-4 fill-current" /> {t.start_session}</>}
            </button>
          </div>
        </div>

        {/* Bottom Section: Charts & Timeline */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 h-80 shrink-0 flex flex-col">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">{t.session_progression}</h3>
          
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                <Line type="monotone" dataKey="anxiety" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Frame Sequence Timeline */}
          {snapshots.length > 0 && (
            <div className="mt-2 h-16 flex gap-2 overflow-x-auto custom-scrollbar pt-2 border-t border-slate-800/50 flex-shrink-0">
               {snapshots.map(snap => (
                 <div key={snap.id} className="flex-shrink-0 relative group cursor-pointer">
                    <img src={snap.imageUrl} alt="snap" className="h-full rounded border border-slate-700 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white px-1 truncate">
                      {snap.triggerType}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Chat */}
      <div className="w-full lg:w-96 lg:h-full lg:border-l lg:border-slate-800 bg-slate-900/50 flex flex-col shrink-0 h-[600px] border-t border-slate-800 lg:border-t-0">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <h3 className="font-bold text-sm text-slate-200">{t.chat_assistant}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-900/30">
          {messages.length === 0 && (
              <p className="text-slate-600 text-sm text-center mt-10 italic">
                {t.chat_placeholder}
              </p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isAiLoading && (
            <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 rounded-xl rounded-bl-none p-3 text-xs animate-pulse">
                  {t.loading_ai}
                </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.chat_placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-primary-500"
              />
              <button 
              onClick={handleSendMessage}
              className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-1.5 p-1 text-primary-400 hover:text-white transition-colors`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Save className="w-5 h-5 text-primary-400" />
              {t.save_session}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.title}</label>
                <input 
                  type="text" 
                  value={saveTitle} 
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm"
                />
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-primary-400 uppercase mb-3">{t.adjust_levels}</h4>
                {(Object.keys(adjustments) as Array<keyof typeof adjustments>).map(key => (
                  <div key={key} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span className="capitalize">{t[key as keyof typeof t]}</span>
                      <span>{adjustments[key]}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={adjustments[key]}
                      onChange={(e) => setAdjustments({...adjustments, [key]: parseInt(e.target.value)})}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">{t.notes}</label>
                <textarea 
                  value={saveNotes} 
                  onChange={(e) => setSaveNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
              >
                {t.discard}
              </button>
              <button 
                onClick={saveJournalEntry}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium"
              >
                {t.save_session}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisDisplay;