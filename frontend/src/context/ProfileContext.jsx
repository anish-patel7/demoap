import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut } from '../api/client';

const ProfileContext = createContext(null);

// Derive avatar initials from a display name: first letters of up to two
// words, uppercased. "Vinod Kumar" -> "VK", "V. K. Sharma" -> "VK".
export function initialsFrom(name) {
  if (!name) return '?';
  const letters = name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, '')[0])
    .filter(Boolean);
  return (letters[0] || '') + (letters[1] || '') || name[0].toUpperCase();
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({
    display_name: 'V. K. Sharma',
    subtitle: 'Pro Account',
  });

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/profile');
      setProfile(data);
    } catch {
      /* keep defaults if the API isn't reachable yet */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(async ({ display_name, subtitle }) => {
    const updated = await apiPut('/profile', { display_name, subtitle });
    setProfile(updated);
    return updated;
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, refresh, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
