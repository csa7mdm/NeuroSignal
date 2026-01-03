import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Save, Activity, Send, MessageSquare, Camera, BrainCircuit, Sparkles, WifiOff, Eye, User, ArrowRight, Bot, Upload, Video, MonitorPlay } from 'lucide-react';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Camera/Device State
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  // Video Source State ('camera' or 'file')
  const [inputMode, setInputMode] = useState<'camera' | 'file'>('camera');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Conclusion State
  const [psychConclusion, setPsychConclusion] = useState<string>("");
  const [baselineData, setBaselineData] = useState<EmotionData | null>(null);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Current (Real-time) values
  const [currentMetrics, setCurrentMetrics] = useState<EmotionData>({
    timestamp: 0, 
    anxiety: 0, 
    excitement: 0, 
    deception: 0, 
    confidence: 50, 
    stress: 0,
    aggression: 0,
    boredom: 0,
    empathy: 50,
    gazeDeviation: 0,
    pupilDilation: 50,
    blinkRate: 20
  });

  // Save Modal State
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [adjustments, setAdjustments] = useState({
    anxiety: 0, stress: 0, confidence: 0, deception: 0, aggression: 0, boredom: 0, empathy: 0,
    gazeDeviation: 0, pupilDilation: 0, blinkRate: 0
  });

  // Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enumerate cameras
  useEffect(() => {
    async function getCameras() {
      try {
        // Request initial permission if needed to get labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }
    getCameras();
  }, []);

  // Handle camera switching
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    async function startCamera() {
      // If in file mode, do not start camera
      if (inputMode === 'file') {
          if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
          }
          return;
      }

      try {
        // Stop previous tracks
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    
    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCameraId, inputMode]);

  // Handle Video File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setUploadedVideoUrl(url);
          // When a file is loaded, reset session
          setSessionData([]);
          setElapsed(0);
          setBaselineData(null);
      }
  };

  // Video Playback Event Listeners (Sync Recording State)
  useEffect(() => {
      const videoEl = videoRef.current;
      if (!videoEl || inputMode === 'camera') return;

      const onPlay = () => setIsRecording(true);
      const onPause = () => setIsRecording(false);
      const onEnded = () => setIsRecording(false);

      videoEl.addEventListener('play', onPlay);
      videoEl.addEventListener('pause', onPause);
      videoEl.addEventListener('ended', onEnded);

      return () => {
          videoEl.removeEventListener('play', onPlay);
          videoEl.removeEventListener('pause', onPause);
          videoEl.removeEventListener('ended', onEnded);
      };
  }, [inputMode, uploadedVideoUrl]);


  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

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
          aggression: Math.min(100, Math.max(0, currentMetrics.aggression + (Math.random() - 0.5) * 6)),
          boredom: Math.min(100, Math.max(0, currentMetrics.boredom + (Math.random() - 0.5) * 4)),
          empathy: Math.min(100, Math.max(0, currentMetrics.empathy + (Math.random() - 0.5) * 5)),
          // Eye Tracking
          gazeDeviation: Math.min(100, Math.max(0, currentMetrics.gazeDeviation + (Math.random() - 0.5) * 8)),
          pupilDilation: Math.min(100, Math.max(0, currentMetrics.pupilDilation + (Math.random() - 0.5) * 4)),
          blinkRate: Math.min(100, Math.max(0, currentMetrics.blinkRate + (Math.random() - 0.5) * 6)),
        };

        setCurrentMetrics(newDataPoint);
        setSessionData(prev => {
            const newData = [...prev, newDataPoint];
            // Keep roughly 2 minutes of history in state for charts to stay performant
            return newData.slice(-120); 
        });

        // Update Baseline
        setBaselineData(prev => {
            if (!prev) return newDataPoint;
            // Simple moving average for baseline
            return {
                timestamp: elapsed,
                anxiety: (prev.anxiety * 0.95) + (newDataPoint.anxiety * 0.05),
                stress: (prev.stress * 0.95) + (newDataPoint.stress * 0.05),
                confidence: (prev.confidence * 0.95) + (newDataPoint.confidence * 0.05),
                deception: (prev.deception * 0.95) + (newDataPoint.deception * 0.05),
                excitement: (prev.excitement * 0.95) + (newDataPoint.excitement * 0.05),
                aggression: (prev.aggression * 0.95) + (newDataPoint.aggression * 0.05),
                boredom: (prev.boredom * 0.95) + (newDataPoint.boredom * 0.05),
                empathy: (prev.empathy * 0.95) + (newDataPoint.empathy * 0.05),
                gazeDeviation: (prev.gazeDeviation * 0.95) + (newDataPoint.gazeDeviation * 0.05),
                pupilDilation: (prev.pupilDilation * 0.95) + (newDataPoint.pupilDilation * 0.05),
                blinkRate: (prev.blinkRate * 0.95) + (newDataPoint.blinkRate * 0.05),
            };
        });

        // Simulate automated snapshot on high triggers
        if (newDataPoint.anxiety > 80 && Math.random() > 0.9) {
          takeSnapshot("High Anxiety");
        }
        if (newDataPoint.deception > 70 && Math.random() > 0.95) {
          takeSnapshot("Deception Hint");
        }
        if (newDataPoint.aggression > 75 && Math.random() > 0.95) {
          takeSnapshot("Micro-Aggression");
        }
        if (newDataPoint.gazeDeviation > 80 && Math.random() > 0.95) {
            takeSnapshot("Gaze Aversion");
        }

      }, 1000);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isRecording, elapsed, currentMetrics]);

  // Advanced Psychological Conclusion Engine
  useEffect(() => {
    if (!isRecording || sessionData.length < 5 || !baselineData) {
      if (!isRecording) setPsychConclusion(t.waiting_for_data);
      return;
    }

    const { anxiety, stress, confidence, deception, excitement, aggression, boredom, empathy, gazeDeviation, blinkRate, pupilDilation } = currentMetrics;
    
    // 1. Calculate Trends (Slope of last 5 seconds)
    const recent = sessionData.slice(-5);
    const startRecent = recent[0];
    const slopeAnxiety = anxiety - startRecent.anxiety;
    const slopeStress = stress - startRecent.stress;
    const slopeConfidence = confidence - startRecent.confidence;

    // 2. Baseline Deviations
    const devAnxiety = anxiety - baselineData.anxiety;
    const devDeception = deception - baselineData.deception;
    
    // Eye Tracking Deviations
    const devPupil = pupilDilation - baselineData.pupilDilation;
    const devBlink = blinkRate - baselineData.blinkRate;

    let conclusion = "";

    // PRIORITY 1: High Deception Clusters (The most critical alert)
    if (deception > 70) {
        if (slopeAnxiety > 5 && stress > 60) {
            conclusion = "⚠️ COGNITIVE OVERLOAD DETECTED: The subject is exhibiting a classic 'Fight or Flight' response while speaking. Rising anxiety coupled with high deception markers suggests they are struggling to fabricate information.";
        } else if (stress < 30 && confidence > 60) {
            conclusion = "⚠️ CALCULATED MANIPULATION: Deception markers are high, but stress is anomalously low. This dissociation typically indicates a rehearsed narrative or a subject comfortable with deceit (Duping Delight).";
        } else {
             conclusion = "⚠️ INCONSISTENCY ALERT: Micro-expressions contradict the baseline. Significant deviation in facial congruency detected.";
        }
    }
    // PRIORITY 2: Eye Tracking Specifics (Pupil & Gaze)
    else if (Math.abs(devPupil) > 15) {
        if (devPupil > 15) {
             if (excitement > 50) conclusion = "PUPILLARY EXPANSION (Interest): Significant dilation suggests strong interest or arousal towards the topic.";
             else if (stress > 60) conclusion = "PUPILLARY EXPANSION (Load): Dilation typically correlates with high cognitive processing effort or fear.";
             else conclusion = "AUTONOMIC SPIKE: Sudden pupil dilation detected without external lighting change.";
        } else {
             if (aggression > 50) conclusion = "PUPILLARY CONSTRICTION (Focus): Constriction with aggression signals intense, possibly hostile, focus.";
             else conclusion = "NEGATIVE AVERSION: Pupil constriction often indicates dislike or withdrawal from the stimulus.";
        }
    }
    else if (gazeDeviation > 75) {
        if (anxiety > 60) {
             conclusion = "EYE CONTACT AVERSION: Subject is avoiding visual contact due to social anxiety or shame.";
        } else if (deception > 50) {
             conclusion = "DECEPTIVE GAZE: Patterned gaze aversion coincident with deception markers.";
        } else {
             conclusion = "VISUAL DISENGAGEMENT: Subject is looking away, possibly recalling information or disengaging.";
        }
    }
    else if (blinkRate > 80 || devBlink > 20) {
        conclusion = "RAPID BLINKING FLURRY: Excessive blink rate indicates high neurological arousal, nervousness, or stress processing.";
    }
    else if (blinkRate < 10 && devBlink < -10) {
         conclusion = "STARE / HYPER-FOCUS: Abnormally low blink rate. Subject may be intensely scrutinizing or zoning out.";
    }
    // PRIORITY 3: Hostility & Aggression
    else if (aggression > 70) {
        if (stress > 60) {
            conclusion = "HOSTILE DEFENSIVENESS: Subject feels backed into a corner. Aggression and stress spikes indicate a reactive state.";
        } else if (confidence > 70) {
            conclusion = "DOMINANT AGGRESSION: Subject is asserting dominance using aggressive micro-expressions. They likely feel superior in this context.";
        } else {
            conclusion = "LATENT HOSTILITY: Underlying aggression detected despite neutral conversation.";
        }
    }
    // PRIORITY 4: Disengagement (Boredom)
    else if (boredom > 75) {
        conclusion = "DISENGAGEMENT: Subject is showing signs of apathy or loss of focus. Consider changing the topic or stimulation.";
    }
    // PRIORITY 5: High Empathy
    else if (empathy > 75) {
        conclusion = "STRONG RAPPORT: Subject is mirroring behaviors and showing high empathy. Connection is established.";
    }
    // PRIORITY 6: Stress & Anxiety Profiles
    else if (anxiety > 75 || stress > 75) {
        if (slopeConfidence < -5) {
            conclusion = "SUBMISSIVE WITHDRAWAL: Subject's confidence is rapidly eroding under pressure. They may be shutting down or preparing to concede.";
        } else if (excitement > 60) {
             conclusion = "VOLATILE STATE: High energy mixed with high stress. Subject is agitated and potentially aggressive. Monitor for vocal pitch spikes.";
        } else {
            conclusion = "HIGH ACUTE STRESS: Significant baseline shift observed. Subject is visibly uncomfortable with the current topic.";
        }
    }
    // PRIORITY 7: Positive/Authority Profiles
    else if (confidence > 80) {
        if (excitement > 70) {
            conclusion = "PASSIONATE CONVICTION: Subject demonstrates strong belief in their statement. Gestures are open and vocal energy is high, indicating truthfulness.";
        } else if (devAnxiety < -10) {
            conclusion = "DOMINANT BASELINE: Subject is more relaxed than their session average. They feel in control of the conversation.";
        } else {
            conclusion = "AUTHORITATIVE STANCE: Body language is open and expansive. Vocal tone is likely steady.";
        }
    }
    // PRIORITY 8: Baseline/Neutral
    else {
        if (Math.abs(slopeAnxiety) < 2 && Math.abs(slopeStress) < 2) {
             conclusion = "ESTABLISHED BASELINE: Subject is exhibiting consistent behavior. No significant psychological leaks detected at this moment.";
        } else {
             conclusion = "GATHERING DATA: Analyzing deviation from established normative behavior...";
        }
    }

    setPsychConclusion(conclusion);

  }, [currentMetrics, sessionData, baselineData, isRecording, t.waiting_for_data]);


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
      aggression: acc.aggression + curr.aggression,
      boredom: acc.boredom + curr.boredom,
      empathy: acc.empathy + curr.empathy,
      gazeDeviation: acc.gazeDeviation + curr.gazeDeviation,
      pupilDilation: acc.pupilDilation + curr.pupilDilation,
      blinkRate: acc.blinkRate + curr.blinkRate
    }), { 
        anxiety: 0, stress: 0, confidence: 0, deception: 0, aggression: 0, boredom: 0, empathy: 0,
        gazeDeviation: 0, pupilDilation: 0, blinkRate: 0
    });
    
    setAdjustments({
      anxiety: Math.round(avgs.anxiety / len),
      stress: Math.round(avgs.stress / len),
      confidence: Math.round(avgs.confidence / len),
      deception: Math.round(avgs.deception / len),
      aggression: Math.round(avgs.aggression / len),
      boredom: Math.round(avgs.boredom / len),
      empathy: Math.round(avgs.empathy / len),
      gazeDeviation: Math.round(avgs.gazeDeviation / len),
      pupilDilation: Math.round(avgs.pupilDilation / len),
      blinkRate: Math.round(avgs.blinkRate / len),
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
        excitement: 0,
        aggression: adjustments.aggression,
        boredom: adjustments.boredom,
        empathy: adjustments.empathy,
        gazeDeviation: adjustments.gazeDeviation,
        pupilDilation: adjustments.pupilDilation,
        blinkRate: adjustments.blinkRate
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
    setBaselineData(null);
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
            excitement: currentMetrics.excitement,
            aggression: currentMetrics.aggression,
            boredom: currentMetrics.boredom,
            empathy: currentMetrics.empathy,
            gazeDeviation: currentMetrics.gazeDeviation,
            pupilDilation: currentMetrics.pupilDilation,
            blinkRate: currentMetrics.blinkRate
        }
    };

    const response = await generateSessionInsight(userMsg.text, tempSession, messages);
    
    const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text, 
        imageUrl: response.imageUrl,
        timestamp: Date.now() 
    };
    setMessages(prev => [...prev, botMsg]);
    setIsAiLoading(false);
  };

  // Improved Message Renderer with Headers, Flows, and Image Frames
  const renderFormattedContent = (text: string) => {
    // Split by newlines but keep delimiters if we need to identify special blocks
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
        const trimmed = line.trim();
        
        // 1. Headers (### or ##)
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            return (
                <div key={i} className="flex items-center gap-2 mt-4 mb-2 text-primary-300 font-bold border-b border-slate-700/50 pb-1">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span>{trimmed.replace(/#/g, '').trim()}</span>
                </div>
            );
        }

        // 2. Flow Diagrams (A -> B -> C)
        if (trimmed.includes('->')) {
            const steps = trimmed.split('->').map(s => s.trim());
            return (
                <div key={i} className="my-4 p-3 bg-slate-950/50 rounded-xl border border-slate-700/50 overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                        {steps.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-medium text-primary-200 border border-slate-700 shadow-sm whitespace-nowrap">
                                    {step}
                                </div>
                                {idx < steps.length - 1 && (
                                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            );
        }

        // 3. Bullet Points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
             const content = trimmed.substring(1).trim();
             return (
                <div key={i} className="flex gap-2 mb-1.5 pl-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0"></div>
                    <span className="text-slate-300 text-sm leading-relaxed">
                        {renderBold(content)}
                    </span>
                </div>
             );
        }

        // 4. Normal Text
        if (trimmed.length > 0) {
            return (
                <p key={i} className="mb-2 text-slate-200 text-sm leading-relaxed">
                    {renderBold(trimmed)}
                </p>
            );
        }

        return <div key={i} className="h-2"></div>;
    });
  };

  // Helper to parse **bold** text
  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  return (
    // Main Container
    <div className="h-full w-full bg-slate-950 block overflow-y-auto lg:flex lg:overflow-hidden custom-scrollbar">
      
      {/* Left Content Area (Video, Gauges, Chart) */}
      <div className="flex-1 flex flex-col gap-4 p-4 lg:overflow-y-auto custom-scrollbar lg:h-full min-h-min">
        
        {/* Top Grid: Video & Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          {/* Video Container */}
          <div className="md:col-span-2 relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
            <video 
                ref={videoRef} 
                src={inputMode === 'file' && uploadedVideoUrl ? uploadedVideoUrl : undefined}
                autoPlay 
                muted={inputMode === 'camera'} // Mute camera to prevent feedback, allow audio for files
                controls={inputMode === 'file'} // Show controls for file upload
                playsInline 
                className={`w-full h-full object-cover ${inputMode === 'camera' ? 'transform scale-x-[-1]' : ''}`} 
            />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
              <div className={`px-3 py-1 rounded-full text-xs font-mono animate-pulse flex items-center gap-2 w-fit ${
                  inputMode === 'file' ? 'bg-blue-600/90' : 'bg-red-600/90'
              } text-white`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                {isRecording ? (inputMode === 'file' ? "VIDEO ANALYSIS" : "LIVE ANALYSIS") : "STANDBY"}
              </div>
              
              {!isOnline && (
                <div className="bg-orange-600/90 text-white px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 w-fit mt-2">
                    <WifiOff className="w-3 h-3" />
                    OFFLINE
                </div>
              )}
            </div>

            {/* Controls Overlay (Mode Switcher) */}
            <div className="absolute top-4 left-4 z-30 pt-16 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-1.5 rounded-full w-fit">
                    <button 
                        onClick={() => setInputMode('camera')}
                        className={`p-2 rounded-full transition-colors ${inputMode === 'camera' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Live Camera Mode"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setInputMode('file')}
                        className={`p-2 rounded-full transition-colors ${inputMode === 'file' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Video Upload Mode"
                    >
                        <Video className="w-4 h-4" />
                    </button>
                </div>

                {/* Camera Selector (Only in Camera Mode) */}
                {inputMode === 'camera' && availableCameras.length > 1 && (
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-1.5 rounded-full w-fit">
                    <Camera className="w-3 h-3 text-primary-400 ml-1.5" />
                    <select 
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="bg-transparent text-[10px] text-slate-100 font-medium focus:outline-none pr-4 cursor-pointer pointer-events-auto"
                    >
                        {availableCameras.map(cam => (
                        <option key={cam.deviceId} value={cam.deviceId} className="bg-slate-900">
                            {cam.label || `${t.default_camera} ${cam.deviceId.slice(0, 4)}`}
                        </option>
                        ))}
                    </select>
                    </div>
                )}
            </div>
            
            {/* File Upload Overlay (Only in File Mode and No Video Loaded) */}
            {inputMode === 'file' && !uploadedVideoUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                     <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex flex-col items-center text-center">
                        <MonitorPlay className="w-12 h-12 text-primary-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Upload Analysis Video</h3>
                        <p className="text-sm text-slate-400 mb-6 max-w-xs">Select a video file to validate system metrics and perform offline analysis.</p>
                        
                        <label className="cursor-pointer bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20">
                            <Upload className="w-4 h-4" />
                            Select Video
                            <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                     </div>
                </div>
            )}
            
            {/* Upload New Video Button (When video is loaded) */}
            {inputMode === 'file' && uploadedVideoUrl && (
                 <div className="absolute bottom-16 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                     <label className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-full border border-slate-700 flex items-center justify-center backdrop-blur-sm">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                 </div>
            )}

            <div className="absolute top-4 right-4 bg-slate-900/80 text-primary-400 px-3 py-1 rounded-full text-xs font-mono z-20">
              {new Date(elapsed * 1000).toISOString().substr(11, 8)}
            </div>
          </div>

          {/* Gauges Container */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col gap-3 min-h-[300px] h-full overflow-y-auto custom-scrollbar relative">
             <div className="sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-800/50 mb-1">
                <h3 className="text-primary-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Activity className="w-4 h-4" /> {t.live_tracking}
                </h3>
             </div>
            
            <div className="space-y-3 pb-2 border-b border-slate-800/50">
                {[
                { label: t.anxiety, val: currentMetrics.anxiety, color: 'bg-red-500' },
                { label: t.stress, val: currentMetrics.stress, color: 'bg-orange-500' },
                { label: t.confidence, val: currentMetrics.confidence, color: 'bg-green-500' },
                { label: t.deception, val: currentMetrics.deception, color: 'bg-purple-500' },
                { label: t.aggression, val: currentMetrics.aggression, color: 'bg-red-700' },
                { label: t.boredom, val: currentMetrics.boredom, color: 'bg-slate-500' },
                { label: t.empathy, val: currentMetrics.empathy, color: 'bg-teal-400' },
                ].map((metric) => (
                <div key={metric.label} className="shrink-0">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>{metric.label}</span>
                    <span>{metric.val.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${metric.color} transition-all duration-500 ease-out`} 
                        style={{ width: `${metric.val}%` }}
                    ></div>
                    </div>
                </div>
                ))}
            </div>

            {/* Eye Tracking Section */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1">
                    <Eye className="w-3 h-3" /> Eye Tracking
                </h4>
                {[
                { label: t.gaze_deviation, val: currentMetrics.gazeDeviation, color: 'bg-blue-400' },
                { label: t.blink_rate, val: currentMetrics.blinkRate, color: 'bg-pink-400' },
                { label: t.pupil_dilation, val: currentMetrics.pupilDilation, color: 'bg-indigo-400' },
                ].map((metric) => (
                <div key={metric.label} className="shrink-0">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>{metric.label}</span>
                    <span>{metric.val.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${metric.color} transition-all duration-500 ease-out`} 
                        style={{ width: `${metric.val}%` }}
                    ></div>
                    </div>
                </div>
                ))}
            </div>
            
            {/* Start/Stop Button (Only for Camera Mode - File Mode uses Video Controls) */}
            {inputMode === 'camera' && (
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
            )}
            
            {inputMode === 'file' && (
                <div className="mt-auto pt-4 text-center">
                    <p className="text-[10px] text-slate-500">
                        {isRecording ? "Analyzing playback..." : "Play video to start analysis"}
                    </p>
                    {isRecording && (
                        <button 
                            onClick={handleStop}
                            className="mt-2 text-xs text-red-500 hover:text-red-400 font-bold"
                        >
                            Stop & Save Session
                        </button>
                    )}
                </div>
            )}
          </div>
        </div>
        
        {/* Psychological Conclusion Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shrink-0 shadow-lg relative overflow-hidden transition-all duration-500">
           {/* Dynamic Background Glow based on state */}
           <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
               currentMetrics.deception > 60 ? 'bg-purple-600/10' : 
               currentMetrics.aggression > 60 ? 'bg-red-800/10' :
               currentMetrics.gazeDeviation > 70 ? 'bg-blue-600/10' :
               currentMetrics.stress > 60 ? 'bg-orange-600/10' : 
               'bg-primary-600/5'
           }`}></div>
           
           <div className="flex items-center gap-3 mb-3 relative z-10">
               <div className="bg-slate-800 p-2 rounded-lg text-primary-400">
                  <BrainCircuit className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-slate-200">{t.psych_conclusion}</h3>
           </div>
           <p className="text-slate-300 text-sm leading-relaxed relative z-10 font-medium">
               {psychConclusion}
           </p>
        </div>

        {/* Bottom Section: Charts & Timeline */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 h-80 shrink-0 flex flex-col">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">{t.session_progression}</h3>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative">
             <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                    <Line type="monotone" dataKey="anxiety" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="deception" stroke="#a855f7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gazeDeviation" stroke="#60a5fa" strokeWidth={1} dot={false} name="Gaze Aversion" />
                  </LineChart>
                </ResponsiveContainer>
             </div>
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
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2 shadow-sm z-10">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <h3 className="font-bold text-sm text-slate-200">{t.chat_assistant}</h3>
          {!isOnline && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-orange-500 ml-auto">Offline Mode</span>}
        </div>
        
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-950/30">
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60">
                <BrainCircuit className="w-12 h-12 mb-3" />
                <p className="text-sm text-center italic">{t.chat_placeholder}</p>
              </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 {/* Avatar */}
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary-600' : 'bg-slate-700'}`}>
                    {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-primary-300" />}
                 </div>

                 {/* Bubble */}
                 <div className={`rounded-2xl p-4 shadow-md transition-all ${
                    msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-none' 
                    : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                    {/* Formatted Content */}
                    <div className="text-sm">
                         {msg.role === 'user' ? <p>{msg.text}</p> : renderFormattedContent(msg.text)}
                    </div>
                    
                    {/* Generated Image Card */}
                    {msg.imageUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-600 bg-black relative group shadow-lg">
                            <img src={msg.imageUrl} alt="Visual Example" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 border border-white/10">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                Reference Simulation
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-3 pt-6">
                                <p className="text-xs text-slate-300">AI Generated Reference</p>
                            </div>
                        </div>
                    )}
                    
                    <span className={`text-[10px] block mt-2 opacity-50 text-right ${msg.role === 'user' ? 'text-primary-100' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                 </div>
              </div>
            </div>
          ))}
          {isAiLoading && (
            <div className="flex justify-start gap-2 items-end">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-primary-300" />
                </div>
                <div className="bg-slate-900 text-slate-400 rounded-2xl rounded-bl-none p-4 text-xs flex items-center gap-2 border border-slate-700">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-200"></div>
                  <span className="ml-2 font-medium">{t.loading_ai}</span>
                </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isOnline ? t.chat_placeholder : "Ask offline assistant..."}
                disabled={isAiLoading}
                className="w-full bg-slate-950 border border-slate-700 rounded-full py-3 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
              />
              <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAiLoading}
              className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-2 p-1.5 rounded-full transition-all ${
                  inputMessage.trim() && !isAiLoading 
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg' 
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {(Object.keys(adjustments) as Array<keyof typeof adjustments>).map(key => (
                    <div key={key} className="mb-2">
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span className="capitalize">{t[key as keyof typeof t] || key}</span>
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