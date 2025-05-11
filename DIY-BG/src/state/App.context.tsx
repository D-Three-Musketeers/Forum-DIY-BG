import { createContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../config/firebase-config';
import { type User as FirebaseUser , onAuthStateChanged } from 'firebase/auth';
import { getUserData } from '../services/users.service';

interface ExtendedUser extends FirebaseUser {
  handle?: string;
}
// Define your context type
interface AppContextType {
  user: ExtendedUser | null;
  userData: any;
  setAppState: (newState: Partial<{ user: ExtendedUser | null; userData: any }>) => void;
}

// Create the context with initial values
export const AppContext = createContext<AppContextType>({
  user: null,
  userData: null,
  setAppState: () => {},
});

// Create the provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  interface AppState {
    user: ExtendedUser | null;
    userData: any;
  }
  
  const [state, setState] = useState<AppState>({
    user: null,
    userData: null,
  });

  // Add auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const rawData = await getUserData(user.uid);
        const userData = rawData ? Object.values(rawData)[0] : null;
  
        if (rawData) {
          setState({ user, userData: userData });
        } else {
          console.error("No user data found for UID:", user.uid);
          setState({ user, userData: null });
        }
      } else {
        setState({ user: null, userData: null });
      }
    });
    return () => unsubscribe();
  }, []);

  const setAppState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  return (
    <AppContext.Provider value={{ ...state, setAppState }}>
      {children}
    </AppContext.Provider>
  );
};
