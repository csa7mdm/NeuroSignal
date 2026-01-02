import { LibraryItem, Language, TrainingQuestion } from './types';

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: '1',
    title: 'Crossed Arms',
    category: 'body',
    description: 'Arms folded across the chest, often creating a barrier.',
    psychTrigger: 'Defensiveness, discomfort, or self-soothing in stressful situations.',
    iconName: 'ShieldAlert'
  },
  {
    id: '2',
    title: 'Micro-Expression: Contempt',
    category: 'body',
    description: 'One side of the mouth raises slightly (unilateral).',
    psychTrigger: 'Feeling of superiority, dislike, or dismissal of the current topic.',
    iconName: 'Smile'
  },
  {
    id: '3',
    title: 'Rapid Blinking',
    category: 'body',
    description: 'Blinking frequency exceeds the average 15-20 times per minute.',
    psychTrigger: 'High stress, cognitive load, or potential deception.',
    iconName: 'EyeOff'
  },
  {
    id: '4',
    title: 'High Pitch Spikes',
    category: 'vocal',
    description: 'Sudden increase in vocal frequency during specific words.',
    psychTrigger: 'Nervousness, lying, or intense excitement.',
    iconName: 'Activity'
  },
  {
    id: '5',
    title: 'Vocal Fry',
    category: 'vocal',
    description: 'Low, creaky vibration at the end of sentences.',
    psychTrigger: 'Fatigue, disinterest, or an attempt to sound authoritative.',
    iconName: 'Mic'
  }
];

export const TRAINING_QUESTIONS: TrainingQuestion[] = [
  {
    id: '1',
    emotion: 'Deception',
    description: 'The subject looks up and to the left while answering a factual question about their past.',
    options: ['Truthfulness', 'Deception', 'Recall', 'Fatigue']
  },
  {
    id: '2',
    emotion: 'Contempt',
    description: 'A unilateral lip corner raise (one side only) appearing for a split second.',
    options: ['Happiness', 'Fear', 'Contempt', 'Sadness']
  },
  {
    id: '3',
    emotion: 'Anxiety',
    description: 'Frequent touching of the neck or adjusting clothing (pacifying behaviors).',
    options: ['Confidence', 'Anxiety', 'Boredom', 'Excitement']
  },
  {
    id: '4',
    emotion: 'Aggression',
    description: 'Chin jutting out, prolonged eye contact without blinking, and lowered eyebrows.',
    options: ['Submission', 'Aggression', 'Surprise', 'Fear']
  },
  {
    id: '5',
    emotion: 'Doubt',
    description: 'Rubbing the eye or ear while listening to a proposal.',
    options: ['Agreement', 'Doubt', 'Joy', 'Anger']
  }
];

export const TRANSLATIONS = {
  en: {
    nav_analyze: "Analyze",
    nav_journal: "Journal",
    nav_library: "Library",
    nav_training: "Training",
    start_session: "Start Session",
    stop_session: "Stop Session",
    psych_insight: "Psychological Insight",
    live_tracking: "Live Tracking",
    session_progression: "Session Progression",
    chat_assistant: "Talk to Data",
    chat_placeholder: "Ask about the session...",
    save_session: "Save Session",
    discard: "Discard",
    notes: "Notes",
    title: "Session Title",
    adjust_levels: "Adjust Detected Levels",
    anxiety: "Anxiety",
    stress: "Stress",
    excitement: "Excitement",
    confidence: "Confidence",
    deception: "Deception Hints",
    date: "Date",
    view_details: "View Details",
    delete: "Delete",
    library_search: "Search signals...",
    body_language: "Body Language",
    vocal_cues: "Vocal Cues",
    no_entries: "No journal entries found.",
    loading_ai: "AI Analyzing...",
    send: "Send",
    frame_timeline: "Detection Timeline",
    avg_score: "Average Score",
    login: "Login",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    welcome: "Welcome",
    logout: "Logout",
    export_csv: "Export CSV",
    export_pdf: "Export PDF",
    start_training: "Start Training",
    question: "Question",
    next: "Next",
    finish: "Finish",
    score: "Your Score",
    correct: "Correct!",
    incorrect: "Incorrect.",
    training_mode: "Emotion Training Mode",
    training_desc: "Test your ability to detect micro-expressions and cues.",
    auth_desc: "Sign in to access your journal and track progress."
  },
  ar: {
    nav_analyze: "تحليل",
    nav_journal: "السجل",
    nav_library: "المكتبة",
    nav_training: "تدريب",
    start_session: "بدء الجلسة",
    stop_session: "إنهاء الجلسة",
    psych_insight: "رؤية نفسية",
    live_tracking: "تتبع مباشر",
    session_progression: "تقدم الجلسة",
    chat_assistant: "تحدث مع البيانات",
    chat_placeholder: "اسأل عن الجلسة...",
    save_session: "حفظ الجلسة",
    discard: "تجاهل",
    notes: "ملاحظات",
    title: "عنوان الجلسة",
    adjust_levels: "تعديل المستويات المكتشفة",
    anxiety: "القلق",
    stress: "التوتر",
    excitement: "الإثارة",
    confidence: "الثقة",
    deception: "مؤشرات الخداع",
    date: "التاريخ",
    view_details: "عرض التفاصيل",
    delete: "حذف",
    library_search: "بحث في الإشارات...",
    body_language: "لغة الجسد",
    vocal_cues: "الإشارات الصوتية",
    no_entries: "لا توجد سجلات محفوظة.",
    loading_ai: "جارٍ التحليل...",
    send: "إرسال",
    frame_timeline: "الجدول الزمني للكشف",
    avg_score: "متوسط الدرجة",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    welcome: "مرحباً",
    logout: "خروج",
    export_csv: "تصدير CSV",
    export_pdf: "تصدير PDF",
    start_training: "بدء التدريب",
    question: "سؤال",
    next: "التالي",
    finish: "إنهاء",
    score: "نتيجتك",
    correct: "صحيح!",
    incorrect: "خطأ.",
    training_mode: "وضع تدريب المشاعر",
    training_desc: "اختبر قدرتك على اكتشاف التعبيرات الدقيقة والإشارات.",
    auth_desc: "سجل الدخول للوصول إلى سجلك وتتبع تقدمك."
  }
};

export const MOCK_CHART_DATA = Array.from({ length: 20 }, (_, i) => ({
  timestamp: i,
  anxiety: 20 + Math.random() * 10,
  excitement: 40 + Math.random() * 10,
  deception: 10 + Math.random() * 5,
  confidence: 60 - Math.random() * 10,
  stress: 15 + Math.random() * 10,
}));
