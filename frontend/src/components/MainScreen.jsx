import React, { useState, useRef, useEffect } from 'react';
import EmergencyCard from './EmergencyCard';
import SupportCard from './SupportCard';
import { Mic, MicOff } from 'lucide-react';

function MainScreen({ profile }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('input'); // 'input', 'high', 'low-medium'
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);

  // M6: Offline Event Listener
  useEffect(() => {
    const handleOffline = () => setView('high');
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition. Please use text.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Default to Hindi/English loosely
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) initSpeechRecognition();
      recognitionRef.current?.start();
    }
  };

  const handleQuickExit = () => {
    window.location.href = 'https://www.google.com';
  };

  const presetChips = [
    { label: "Active Craving", color: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200", payload: "I am having a strong craving right now and need grounding", indicator: "🟢" },
    { label: "Severe Anxiety", color: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200", payload: "I feel overwhelmed and anxious, help me calm down", indicator: "🟡" },
    { label: "Need a Script", color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200", payload: "I want to talk to my trusted contact, give me a short script", indicator: "🔵" },
    { label: "Immediate Crisis", color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200", payload: "I took something dangerous / I am in immediate physical danger", indicator: "🔴" }
  ];

  const submitText = async (payloadText) => {
    if (!payloadText.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Classify/Triage
      const classifyRes = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText })
      });
      
      if (!classifyRes.ok) throw new Error('Classification failed');
      
      const classifyData = await classifyRes.json();
      
      if (classifyData.category === 'HIGH') {
        setView('high');
        setLoading(false);
        return;
      }
      
      // Step 2: Generate for LOW/MEDIUM
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText, profile, category: classifyData.category })
      });
      
      if (!generateRes.ok) throw new Error('Generation failed');
      
      const generateData = await generateRes.json();
      setGeneratedMessage(generateData.message);
      setView('low-medium');
      
    } catch (err) {
      setError('Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip) => {
    setText(chip.payload);
    submitText(chip.payload);
  };

  const handleSubmit = async () => {
    submitText(text);
  };

  if (view === 'high') {
    return <EmergencyCard />;
  }

  if (view === 'low-medium') {
    return <SupportCard message={generatedMessage} profile={profile} onReset={() => setView('input')} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[60vh] gap-6">
      {profile?.calming_phrase && (
        <div className="mb-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-900 mb-1">Hello {profile?.name || 'there'}</h2>
            <p className="text-slate-500 text-sm">Remember your phrase:</p>
          </div>
          <div className="bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100 max-w-sm">
            <p className="text-lg italic text-emerald-800 font-medium">
              "{profile.calming_phrase}"
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Need support?</h3>
        
        <div className="w-full mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {presetChips.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip)}
                className={`h-14 px-4 flex items-center justify-center gap-2 text-sm md:text-base font-bold rounded-2xl transition-all border shadow-sm ${chip.color}`}
                aria-label={chip.label}
              >
                <span>{chip.indicator}</span> {chip.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="What are you feeling right now? (Optional)" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button 
              className={`h-[72px] w-[72px] rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-emerald-100 border-emerald-300 shadow-inner' : 'bg-white hover:bg-emerald-50 border-slate-200 shadow-sm'} border relative`}
              onClick={toggleListen}
              disabled={loading}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening && <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-20 animate-ping"></span>}
              {isListening ? <MicOff className="text-emerald-700" size={28} /> : <Mic className="text-emerald-600" size={28} />}
            </button>
          </div>
        </div>

        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl mb-6 text-center border border-red-100 font-medium">{error}</div>}

        <button 
          className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold rounded-2xl mt-auto shadow-md active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100" 
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          aria-label="I need support now"
        >
          {loading ? 'Getting support...' : 'I need support now'}
        </button>
      </div>
    </div>
  );
}

export default MainScreen;
