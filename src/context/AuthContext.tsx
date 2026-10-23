import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api';

interface AuthContextType {
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { student_id?: string; first_name?: string; last_name?: string; pin: string }) => Promise<void>;
  register: (first_name: string, last_name: string, age: number, pin: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  switchToDemoStudent: () => Promise<void>;
  switchToAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      let currentToken = getStoredToken();
      if (!currentToken) {
        currentToken = 'student_demo-student-id';
        setStoredToken(currentToken);
        setToken(currentToken);
      }
      const { profile } = await api.getMe();
      setProfile(profile);
    } catch (err) {
      console.warn('Failed to fetch profile session:', err);
      // Fallback to demo profile without crashing
      try {
        const demoToken = 'student_demo-student-id';
        setStoredToken(demoToken);
        setToken(demoToken);
        const { profile } = await api.getMe();
        setProfile(profile);
      } catch {
        clearStoredToken();
        setToken(null);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (credentials: { student_id?: string; first_name?: string; last_name?: string; pin: string }) => {
    const res = await api.login(credentials);
    setStoredToken(res.token);
    setToken(res.token);
    setProfile(res.profile);
  };

  const register = async (first_name: string, last_name: string, age: number, pin: string) => {
    const res = await api.register(first_name, last_name, age, pin);
    setStoredToken(res.token);
    setToken(res.token);
    setProfile(res.profile);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setProfile(null);
  };

  const switchToDemoStudent = async () => {
    await login({ first_name: 'Azizbek', last_name: 'Karimov', pin: '1234' });
  };

  const switchToAdmin = async () => {
    await login({ student_id: 'admin-master-id', pin: '9944' });
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        switchToDemoStudent,
        switchToAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
