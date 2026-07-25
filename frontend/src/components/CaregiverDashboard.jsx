import React, { useState } from 'react';
import EmergencyCard from './EmergencyCard'; // Assuming we can reuse this

const CaregiverDashboard = ({ profile }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('/api/caregiver/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      
      if (!res.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('Something went wrong — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto pb-24">
      <h2 className="text-2xl font-semibold text-slate-800">Caregiver Dashboard</h2>
      
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Linked Patient</h3>
        <span className="text-slate-800 font-medium text-lg">{profile?.name || 'Your linked patient'}</span>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-2">Get De-escalation Advice</h3>
        <p className="text-slate-600 mb-4 text-sm">Describe what they are doing or saying right now. I will give you a short, calm response.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe what's happening right now..."
            className="w-full p-4 border border-slate-200 rounded-xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button 
            type="submit" 
            disabled={loading || !inputText.trim()}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Get Advice'}
          </button>
        </form>

        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}

        {response && (
          <div className="mt-6">
            {response.emergency ? (
              <EmergencyCard />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 text-teal-900 rounded-xl border border-teal-100">
                  <h4 className="text-xs uppercase font-bold tracking-wider mb-1 text-teal-700">Say this:</h4>
                  <p className="text-lg">"{response.script}"</p>
                </div>
                {response.avoid_tip && (
                  <div className="p-4 bg-orange-50 text-orange-900 rounded-xl border border-orange-100">
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-1 text-orange-700">Avoid saying:</h4>
                    <p className="text-sm">{response.avoid_tip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">General Guidelines</h3>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
          <li>Stay calm and keep your voice steady.</li>
          <li>Do not argue or try to reason logically during an active craving.</li>
          <li>Don't ask "why" questions—they trigger defensiveness.</li>
        </ul>
      </div>

      <div className="opacity-70 transform scale-95 mt-4">
        <EmergencyCard />
      </div>
    </div>
  );
};

export default CaregiverDashboard;
