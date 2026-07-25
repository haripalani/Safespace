import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import MainScreen from './components/MainScreen';
import EducationLibrary from './components/EducationLibrary';
import CaregiverDashboard from './components/CaregiverDashboard';

function App() {
  const [profile, setProfile] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');

  useEffect(() => {
    // Only keeping session state in memory per requirements
  }, []);

  const handleProfileSave = (newProfile) => {
    setProfile(newProfile);
    setIsOnboarded(true);
  };

  if (!isOnboarded) {
    return <Onboarding onComplete={handleProfileSave} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'home' && <MainScreen profile={profile} />}
        {currentTab === 'education' && <EducationLibrary />}
        {currentTab === 'caregiver' && <CaregiverDashboard profile={profile} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around">
          <button 
            onClick={() => setCurrentTab('home')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${currentTab === 'home' ? 'text-teal-700 border-t-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Support
          </button>
          <button 
            onClick={() => setCurrentTab('education')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${currentTab === 'education' ? 'text-teal-700 border-t-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Learn
          </button>
          <button 
            onClick={() => setCurrentTab('caregiver')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${currentTab === 'caregiver' ? 'text-teal-700 border-t-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Caregiver
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
