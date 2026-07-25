import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, LayoutDashboard, User, ShieldAlert, BookOpen } from 'lucide-react';
import Onboarding from './components/Onboarding';
import MainScreen from './components/MainScreen';
import CaregiverDashboard from './components/CaregiverDashboard';
import AuthScreen from './components/AuthScreen';
import EmergencyCard from './components/EmergencyCard';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
    // Feature 2: Quick Exit & State Wiper
    window.speechSynthesis?.cancel(); // Stop TTS
    localStorage.clear();
    sessionStorage.clear();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {}
    setUser(null);
    setProfile(null);
    window.location.href = 'https://www.google.com'; // Quick Exit safety
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleOffline = () => {
      setIsOffline(true);
      window.speechSynthesis?.cancel(); // Cancel TTS if offline
    };
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative">
        {isOffline && (
          <div className="absolute top-0 w-full bg-red-600 text-white font-bold p-3 text-center z-50 flex justify-center items-center gap-2 shadow-md">
            <ShieldAlert size={20} /> ⚠️ Network Disconnected — Displaying Emergency Direct Calls
          </div>
        )}
        {isOffline ? <EmergencyCard /> : <AuthScreen onLoginSuccess={fetchCurrentUser} />}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans relative">
      {isOffline && (
        <div className="absolute top-0 w-full bg-red-600 text-white font-bold p-3 text-center z-50 flex justify-center items-center gap-2 shadow-md">
          <ShieldAlert size={20} /> ⚠️ Network Disconnected — Displaying Emergency Direct Calls
        </div>
      )}
      
      {/* MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-emerald-900 text-white shadow-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-emerald-900 font-bold text-lg">S</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">SafeSpace</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-3 py-2 h-14 bg-red-900/80 hover:bg-red-900 rounded-lg text-sm font-bold border border-red-800"
          aria-label="Quick Exit"
        >
          <ShieldAlert size={16} /> Quick Exit
        </button>
      </div>

      {/* LEFT PANEL: Sidebar (Hidden on mobile) */}
      <div className="hidden md:flex w-[280px] min-w-[280px] bg-emerald-900 border-r border-emerald-800 flex-col justify-between rounded-r-3xl my-2 ml-2 shadow-2xl z-10 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12 text-emerald-50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-emerald-900 font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SafeSpace</h1>
              <p className="text-xs text-emerald-300">Self care dashboard</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <div className="flex items-center gap-4 px-4 py-3 bg-white text-emerald-900 rounded-xl font-semibold shadow-sm cursor-pointer">
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 text-emerald-100 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer">
              <User size={20} />
              <span>Profile</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 text-emerald-100 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer">
              <BookOpen size={20} />
              <span>Guidelines</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 text-red-200 hover:bg-red-900/50 rounded-xl transition-colors cursor-pointer mt-4 border border-emerald-800">
              <ShieldAlert size={20} />
              <span>Emergency</span>
            </div>
          </nav>
        </div>

        <div className="p-8">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-4 px-4 py-3 h-14 text-red-100 bg-red-900/50 hover:bg-red-900 rounded-xl transition-colors w-full cursor-pointer font-bold border border-red-800"
            aria-label="Quick Exit"
          >
            <ShieldAlert size={20} />
            <span>Quick Exit / Clear</span>
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive Content */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-100 dark:bg-slate-900 flex flex-col p-4 md:p-6 lg:p-10 relative">
        <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
          {/* Header area like the search bar/profile in reference */}
          <div className="hidden md:flex justify-between items-center bg-white p-4 rounded-full shadow-sm mb-8">
            <div className="flex-1 px-4 text-slate-400 text-sm">
              Search resources...
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col mt-4 md:mt-0">
            {isOffline ? (
              <div className="flex-1 flex items-center justify-center">
                <EmergencyCard />
              </div>
            ) : (
              <>
                {user.role === 'patient' && !profile && (
                  <Onboarding user={user} onComplete={handleProfileSave} />
                )}
                {user.role === 'patient' && profile && (
                  <MainScreen profile={profile} />
                )}
                {user.role === 'caregiver' && (
                  <CaregiverDashboard profile={profile} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
