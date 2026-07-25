import React from 'react';

function EmergencyCard() {
  return (
    <div className="emergency-card container">
      <h2>Emergency Support</h2>
      <p>Your safety is the priority right now. Please reach out to professional help immediately.</p>
      
      <a href="tel:112" style={{ textDecoration: 'none' }}>
        <button className="emergency-btn" aria-label="Call Emergency 112">
          📞 112 (Emergency)
        </button>
      </a>
      
      <a href="tel:18005990019" style={{ textDecoration: 'none' }}>
        <button className="emergency-btn" aria-label="Call KIRAN Helpline">
          📞 1800-599-0019 (KIRAN)
        </button>
      </a>
      
      <a href="tel:14416" style={{ textDecoration: 'none' }}>
        <button className="emergency-btn" aria-label="Call Tele-MANAS">
          📞 14416 (Tele-MANAS)
        </button>
      </a>
    </div>
  );
}

export default EmergencyCard;
