import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LoginProps {
  language: Language;
}

const Login: React.FC<LoginProps> = ({ language }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Visual only for this demo
  const { login, signup, isLoading } = useAuth();
  const t = TRANSLATIONS[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      await signup(email, name);
    } else {
      await login(email, name);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mb-4 transform rotate-3">
                    <Activity className="text-white w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">NeuroSignal</h1>
                <p className="text-slate-400 text-sm mt-2 text-center">{t.auth_desc}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                    <div className="relative">
                        <UserIcon className={`absolute top-3 w-5 h-5 text-slate-500 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={isSignup}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-10 text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className={`absolute top-3 w-5 h-5 text-slate-500 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                    <input
                        type="email"
                        placeholder={t.email}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-10 text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                </div>

                <div className="relative">
                    <Lock className={`absolute top-3 w-5 h-5 text-slate-500 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                    <input
                        type="password"
                        placeholder={t.password}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-10 text-slate-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-500/20 transition-all flex justify-center items-center gap-2"
                >
                   {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                       isSignup ? t.signup : t.login
                   )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-sm text-slate-400 hover:text-primary-400 transition-colors"
                >
                    {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </button>
            </div>
        </div>
    </div>
  );
};

export default Login;
