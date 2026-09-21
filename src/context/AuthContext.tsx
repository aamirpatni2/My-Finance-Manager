import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuthState,
  saveFinancialStateToCloud,
  fetchFinancialStateFromCloud,
  subscribeToFinancialState,
} from '../firebase/service';
import { testConnection } from '../firebase/config';
import { AppState } from '../types/finance';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: (currentState: AppState) => Promise<void>;
  onCloudStateReceived?: (cloudState: AppState) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  currentState: AppState;
  onStateUpdateFromCloud: (cloudState: AppState) => void;
}> = ({ children, currentState, onStateUpdateFromCloud }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const stateRef = useRef<AppState>(currentState);
  useEffect(() => {
    stateRef.current = currentState;
  }, [currentState]);

  // Initial connection test on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        try {
          // Check if user has data in Firestore
          const cloudData = await fetchFinancialStateFromCloud(currentUser.uid);
          if (cloudData) {
            // Restore from cloud
            onStateUpdateFromCloud(cloudData);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          } else {
            // First time login - upload current state to Firestore so user doesn't lose anything
            await saveFinancialStateToCloud(currentUser.uid, stateRef.current);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          }
        } catch (err: unknown) {
          console.error('Error during initial cloud hydration:', err);
          setSyncStatus('error');
          setSyncError(err instanceof Error ? err.message : 'Cloud synchronization error');
        }
      } else {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, [onStateUpdateFromCloud]);

  // Real-time Firestore sync listener when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToFinancialState(
      user.uid,
      (cloudData) => {
        onStateUpdateFromCloud(cloudData);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      },
      () => {
        // Doc doesn't exist yet
      }
    );

    return () => unsubscribe();
  }, [user, onStateUpdateFromCloud]);

  const signIn = useCallback(async () => {
    setSyncError(null);
    setSyncStatus('syncing');
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    setSyncError(null);
    try {
      await logoutUser();
      setUser(null);
      setSyncStatus('offline');
    } catch (err: unknown) {
      console.error('Sign-out error:', err);
      setSyncError(err instanceof Error ? err.message : 'Sign-out failed');
    }
  }, []);

  const syncNow = useCallback(async (stateToSync: AppState) => {
    if (!user) return;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      await saveFinancialStateToCloud(user.uid, stateToSync);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err: unknown) {
      console.error('Manual sync error:', err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncStatus,
        lastSyncedAt,
        syncError,
        signIn,
        signOut,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
