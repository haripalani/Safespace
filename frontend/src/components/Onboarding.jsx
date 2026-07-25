import React, { useState } from 'react';

function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [trustedContact, setTrustedContact] = useState('');
  const [calmingPhrase, setCalmingPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trusted_contact: trustedContact,
          calming_phrase: calmingPhrase
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      
      const data = await response.json();
      onComplete(data.profile);
    } catch (err) {
      setError('Something went wrong — please try again');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete({ name: '', trusted_contact: '', calming_phrase: '' });
  };

  return (
    <div className="card container">
      <h2>Welcome to SafeSpace</h2>
      <p>Take a moment to set up your support profile. You can skip this if you want to remain entirely anonymous.</p>
      
      {error && <div className="error-message">{error}</div>}

      <input 
        type="text" 
        placeholder="Your Name" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
      />
      
      <input 
        type="text" 
        placeholder="Trusted Contact Name (e.g. Rahul, Sister)" 
        value={trustedContact}
        onChange={(e) => setTrustedContact(e.target.value)}
        maxLength={100}
      />
      
      <input 
        type="text" 
        placeholder="A calming phrase that works for you" 
        value={calmingPhrase}
        onChange={(e) => setCalmingPhrase(e.target.value)}
        maxLength={250}
      />

      <button className="primary" onClick={handleSave} disabled={loading} aria-label="Save profile">
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
      <button className="secondary" onClick={handleSkip} aria-label="Skip onboarding">
        Skip
      </button>
    </div>
  );
}

export default Onboarding;
