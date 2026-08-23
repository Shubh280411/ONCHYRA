'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  uid: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  uid: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = getClientAuth();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          localStorage.setItem('onc_uid', firebaseUser.uid);
          document.cookie = `onc_uid=${firebaseUser.uid};path=/;max-age=31536000`;
        } else {
          localStorage.removeItem('onc_uid');
          document.cookie = 'onc_uid=;path=/;max-age=0';
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, uid: user?.uid || null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
