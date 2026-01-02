import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => Promise<void>;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('neurosignal_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Simulating Firebase Auth
  // In a real app, you would use:
  // import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
  // and manage the auth state listener.

  const login = async (email: string, name: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo: create a consistent ID based on email
    const fakeUser: User = {
      id: btoa(email),
      email,
      name: name || email.split('@')[0]
    };
    
    setUser(fakeUser);
    localStorage.setItem('neurosignal_user', JSON.stringify(fakeUser));
    setIsLoading(false);
  };

  const signup = async (email: string, name: string) => {
    // Same as login for this simulation
    await login(email, name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neurosignal_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
