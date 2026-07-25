import React from 'react';

const CaregiverDashboard = ({ profile }) => {
  return (
    <div className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto pb-24">
      <h2 className="text-2xl font-semibold text-slate-800">Caregiver Dashboard</h2>
      
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Active Profile</h3>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500 block">User Name</span>
            <span className="text-slate-800 font-medium">{profile?.name || 'Not set'}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Trusted Contact</span>
            <span className="text-slate-800 font-medium">{profile?.trusted_contact || 'Not set'}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Calming Phrase</span>
            <span className="text-slate-800 font-medium italic">"{profile?.calming_phrase || 'Not set'}"</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-2">De-escalation Scripts</h3>
        <p className="text-slate-600 mb-4 text-sm">Use these neutral, non-judgmental phrases when offering support during a craving or crisis moment.</p>
        <div className="space-y-3">
          <div className="p-3 bg-teal-50 text-teal-900 rounded-lg text-sm">
            "I'm right here with you. We can just sit together."
          </div>
          <div className="p-3 bg-teal-50 text-teal-900 rounded-lg text-sm">
            "I know this is incredibly hard. You're doing a good job."
          </div>
          <div className="p-3 bg-teal-50 text-teal-900 rounded-lg text-sm">
            "What do you need from me right now? I can listen, or I can help distract you."
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
