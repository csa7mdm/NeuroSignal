import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Check, AlertTriangle, Loader2, XCircle, Server, DownloadCloud } from 'lucide-react';
import { Language, OpenRouterModel } from '../types';
import { TRANSLATIONS } from '../constants';
import { getOpenRouterModels } from '../services/geminiService';

interface SettingsProps {
  language: Language;
}

const Settings: React.FC<SettingsProps> = ({ language }) => {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  
  // Model Selection State
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const savedKey = localStorage.getItem('neurosignal_openrouter_key');
    if (savedKey) {
      setOpenRouterKey(savedKey);
      setValidationStatus('valid'); // Assume saved key is valid initially
    }
    
    const savedModel = localStorage.getItem('neurosignal_openrouter_model');
    if (savedModel) {
        setSelectedModel(savedModel);
    }
  }, []);

  const validateKey = async (key: string) => {
    setValidationStatus('validating');
    try {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });
      
      if (response.ok) {
        setValidationStatus('valid');
        return true;
      } else {
        setValidationStatus('invalid');
        return false;
      }
    } catch (error) {
      console.error("Validation error", error);
      setValidationStatus('invalid');
      return false;
    }
  };

  const handleFetchModels = async () => {
      if (!openRouterKey) return;
      setIsLoadingModels(true);
      const allModels = await getOpenRouterModels(openRouterKey);
      
      // Filter for free models: check pricing is 0 OR id has ":free"
      const freeModels = allModels.filter(m => {
          const isFreeId = m.id.toLowerCase().includes(':free');
          const isFreePricing = parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0;
          return isFreeId || isFreePricing;
      });
      
      setModels(freeModels);
      setIsLoadingModels(false);
  };

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedModel(val);
      if (val) {
          localStorage.setItem('neurosignal_openrouter_model', val);
      } else {
          localStorage.removeItem('neurosignal_openrouter_model');
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSave = async () => {
    const keyToSave = openRouterKey.trim();
    
    // Allow clearing the key (saving empty string) without validation
    if (!keyToSave) {
        localStorage.removeItem('neurosignal_openrouter_key');
        setValidationStatus('idle');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        return;
    }

    const isValid = await validateKey(keyToSave);
    
    if (isValid) {
      localStorage.setItem('neurosignal_openrouter_key', keyToSave);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
      // Auto fetch models if valid
      if (models.length === 0) {
          handleFetchModels();
      }
    }
  };

  const getStatusIcon = () => {
    if (validationStatus === 'validating') return <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />;
    if (validationStatus === 'valid') return <Check className="w-5 h-5 text-green-500" />;
    if (validationStatus === 'invalid') return <XCircle className="w-5 h-5 text-red-500" />;
    return null;
  };

  const getStatusText = () => {
    if (validationStatus === 'validating') return <span className="text-primary-400 text-xs">{t.validating}</span>;
    if (validationStatus === 'valid') return <span className="text-green-500 text-xs">{t.key_valid}</span>;
    if (validationStatus === 'invalid') return <span className="text-red-500 text-xs">{t.key_invalid}</span>;
    return null;
  };

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-6">
          <div className="bg-slate-800 p-3 rounded-xl text-primary-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t.settings_title}</h2>
            <p className="text-slate-400 text-sm">{t.api_config}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-orange-400 mt-1">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-slate-200">
                    {t.openrouter_key}
                  </label>
                  <div className="flex items-center gap-2">
                    {getStatusText()}
                  </div>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {t.openrouter_desc}
              </p>
              
              <div className="relative">
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => {
                    setOpenRouterKey(e.target.value);
                    if (validationStatus !== 'idle') setValidationStatus('idle');
                  }}
                  placeholder="sk-or-..."
                  className={`w-full bg-slate-950 border rounded-xl py-3 pl-4 pr-12 text-slate-100 focus:outline-none transition-all font-mono text-sm ${
                    validationStatus === 'invalid' 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : validationStatus === 'valid'
                      ? 'border-green-500/50 focus:border-green-500'
                      : 'border-slate-700 focus:border-primary-500'
                  }`}
                />
                <div className="absolute right-4 top-3">
                    {getStatusIcon()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <button
              onClick={handleSave}
              disabled={validationStatus === 'validating'}
              className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                isSaved 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                  : validationStatus === 'validating'
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : validationStatus === 'validating' ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
              {isSaved ? t.saved_successfully : validationStatus === 'validating' ? t.validating : t.save_settings}
            </button>
          </div>
          
          {/* Model Selection Section */}
          <div className="border-t border-slate-800 pt-6 mt-6">
              <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-blue-400 mt-1">
                      <Server className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-bold text-slate-200">
                              {t.model_selection}
                          </label>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {t.model_help}
                      </p>
                      
                      <div className="flex gap-2 mb-3">
                          <button
                            onClick={handleFetchModels}
                            disabled={isLoadingModels || validationStatus !== 'valid'}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                isLoadingModels 
                                ? 'bg-slate-800 text-slate-500' 
                                : validationStatus === 'valid'
                                ? 'bg-slate-800 text-primary-400 hover:bg-slate-700 hover:text-primary-300 border border-slate-700'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                            }`}
                          >
                            {isLoadingModels ? <Loader2 className="w-3 h-3 animate-spin"/> : <DownloadCloud className="w-3 h-3"/>}
                            {isLoadingModels ? t.fetching : t.fetch_models}
                          </button>
                      </div>

                      <select
                          value={selectedModel}
                          onChange={handleModelSelect}
                          disabled={models.length === 0}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-primary-500 transition-all font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <option value="">{models.length > 0 ? t.select_model : t.use_default}</option>
                          {models.map(model => (
                              <option key={model.id} value={model.id}>
                                  {model.name.replace(':free', '')} ({model.id})
                              </option>
                          ))}
                      </select>
                      {models.length === 0 && selectedModel && (
                           <p className="text-[10px] text-slate-500 mt-2">Currently using manually saved model: {selectedModel}</p>
                      )}
                      {models.length === 0 && validationStatus === 'valid' && !isLoadingModels && (
                          <p className="text-[10px] text-slate-500 mt-2 italic">Click "Fetch Free Models" to load available options.</p>
                      )}
                  </div>
              </div>
          </div>
        </div>
        
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-6 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
             <p className="text-xs text-slate-400">
                Without this key, if the application exceeds the standard Gemini API quota (Error 429), analysis and chat features will be temporarily unavailable until the quota resets.
             </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;