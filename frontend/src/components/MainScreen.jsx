import React, { useState, useRef } from 'react';
import EmergencyCard from './EmergencyCard';
import SupportCard from './SupportCard';

function MainScreen({ profile }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('input'); // 'input', 'high', 'low-medium'
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);

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

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Classify
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
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
        body: JSON.stringify({ text, profile })
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

  if (view === 'high') {
    return <EmergencyCard />;
  }

  if (view === 'low-medium') {
    return <SupportCard message={generatedMessage} profile={profile} onReset={() => setView('input')} />;
  }

  return (
    <div className="card container">
      {profile?.calming_phrase && (
        <p style={{ fontStyle: 'italic', opacity: 0.8, textAlign: 'center' }}>
          "{profile.calming_phrase}"
        </p>
      )}
      
      <button 
        className="primary" 
        style={{ padding: '3rem 2rem', fontSize: '1.5rem', marginBottom: '2rem' }}
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        aria-label="I need support now"
      >
        {loading ? 'Getting support...' : 'I need support now'}
      </button>

      {error && <div className="error-message">{error}</div>}
      
      <div className="input-container">
        <div className="mic-container">
          <input 
            type="text" 
            placeholder="What are you feeling right now? (Optional)" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            style={{ marginBottom: 0 }}
          />
          <button 
            className="mic-btn" 
            onClick={toggleListen}
            disabled={loading}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? '🛑' : '🎤'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;
