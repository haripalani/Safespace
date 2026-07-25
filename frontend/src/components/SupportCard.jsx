import React from 'react';

function SupportCard({ message, profile, onReset }) {
  const contactName = profile?.trusted_contact || 'someone you trust';

  return (
    <div className="card container">
      <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{message}</p>
      
      <a href="tel:" style={{ textDecoration: 'none' }}>
        <button className="primary" aria-label={`Call ${contactName}`}>
          Call {contactName}
        </button>
      </a>
      
      <button className="secondary" onClick={onReset} aria-label="Start over">
        I need more support
      </button>
    </div>
  );
}

export default SupportCard;
