import React, { useState } from 'react';
import { Target, CheckCircle, XCircle, RefreshCw, Play } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, TRAINING_QUESTIONS } from '../constants';

interface TrainingProps {
  language: Language;
}

const Training: React.FC<TrainingProps> = ({ language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const t = TRANSLATIONS[language];
  const currentQuestion = TRAINING_QUESTIONS[currentQuestionIndex];

  const handleStart = () => {
    setIsPlaying(true);
    setScore(0);
    setCurrentQuestionIndex(0);
    setIsFinished(false);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    if (option === currentQuestion.emotion) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < TRAINING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
            <Target className="w-10 h-10 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">{t.training_mode}</h2>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          {t.training_desc}
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          {t.start_training}
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-primary-500">
            <span className="text-4xl font-bold text-white">{Math.round((score / TRAINING_QUESTIONS.length) * 100)}%</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{t.finish}!</h2>
        <p className="text-slate-400 mb-8">{t.score}: {score} / {TRAINING_QUESTIONS.length}</p>
        <button
          onClick={handleStart}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold border border-slate-600 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col items-center max-w-3xl mx-auto">
      <div className="w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-slate-400">
            <Target className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-medium">{t.training_mode}</span>
        </div>
        <span className="text-slate-500 font-mono text-sm">
            {currentQuestionIndex + 1} / {TRAINING_QUESTIONS.length}
        </span>
      </div>

      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex-1 flex flex-col">
        {/* Visual Placeholder (Simulated Video/Image) */}
        <div className="w-full h-48 bg-slate-950 rounded-xl mb-6 flex items-center justify-center border border-slate-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950"></div>
            <div className="relative z-10 text-center p-4">
                <p className="text-lg font-medium text-slate-200 italic">"{currentQuestion.description}"</p>
            </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-6 text-center">{t.question}: What emotion is being displayed?</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.emotion;
            const showCorrect = selectedOption && isCorrect;
            const showWrong = isSelected && !isCorrect;
            
            let btnClass = "bg-slate-800 border-slate-700 hover:bg-slate-750";
            if (showCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-400";
            else if (showWrong) btnClass = "bg-red-500/20 border-red-500 text-red-400";
            else if (selectedOption && option === currentQuestion.emotion) btnClass = "bg-green-500/20 border-green-500 text-green-400"; // Show correct answer if wrong selected

            return (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
                className={`p-4 rounded-xl border transition-all font-medium flex items-center justify-between ${btnClass}`}
              >
                {option}
                {showCorrect && <CheckCircle className="w-5 h-5" />}
                {showWrong && <XCircle className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="mt-auto flex justify-end animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold flex items-center gap-2"
            >
              {currentQuestionIndex === TRAINING_QUESTIONS.length - 1 ? t.finish : t.next}
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;
