import React, { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import MainScreen from './components/MainScreen';
import CaregiverDashboard from './components/CaregiverDashboard';
import AuthScreen from './components/AuthScreen';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleProfileSave = (newProfile) => {
    setProfile(newProfile);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={fetchCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">Logout</button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {user.role === 'patient' && !profile && (
          <Onboarding user={user} onComplete={handleProfileSave} />
        )}
        {user.role === 'patient' && profile && (
          <MainScreen profile={profile} />
        )}
        {user.role === 'caregiver' && (
          <CaregiverDashboard profile={profile} />
        )}
      </div>
    </div>
  );
}

export default App;
