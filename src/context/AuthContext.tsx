import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuthState,
  saveFinancialStateToCloud,
  fetchFinancialStateFromCloud,
  subscribeToFinancialState,
  completeRedirectSignIn,
} from '../firebase/service';
import { testConnection } from '../firebase/config';
import { AppState } from '../types/finance';
import { syncSignature } from '../utils/syncState';

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

  const userRef = useRef<FirebaseUser | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Signature of the records last known to match the cloud copy. Anything that
  // matches it needs no upload, and a snapshot that matches it is just the echo
  // of our own write — applying that echo could overwrite a newer local edit.
  const lastSyncedSig = useRef<string | null>(null);

  const applyCloudState = useCallback(
    (cloudState: AppState) => {
      lastSyncedSig.current = syncSignature(cloudState);
      onStateUpdateFromCloud(cloudState);
    },
    [onStateUpdateFromCloud]
  );

  // Auto-sync local edits. Lives here rather than in App so a failed write
  // shows up in the sync badge instead of only in the console.
  const signature = useMemo(() => syncSignature(currentState), [currentState]);
  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser || signature === lastSyncedSig.current) return;

    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await saveFinancialStateToCloud(currentUser.uid, stateRef.current);
        lastSyncedSig.current = signature;
        setSyncStatus('synced');
        setSyncError(null);
        setLastSyncedAt(new Date());
      } catch (err: unknown) {
        console.error('Auto cloud sync error:', err);
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Cloud sync failed');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [signature]);

  // Initial connection test on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Mobile and installed-app sign-in returns here via redirect rather than a popup.
  useEffect(() => {
    completeRedirectSignIn().catch((err) => {
      console.error('Redirect sign-in completion failed:', err);
    });
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
            applyCloudState(cloudData);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          } else {
            // First time login - upload current state to Firestore so user doesn't lose anything
            await saveFinancialStateToCloud(currentUser.uid, stateRef.current);
            lastSyncedSig.current = syncSignature(stateRef.current);
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
  }, [applyCloudState]);

  // Real-time Firestore sync listener when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToFinancialState(
      user.uid,
      (cloudData) => {
        // Echo of our own last write: already reflected locally, and applying it
        // late could clobber an edit made while the write was in flight.
        if (syncSignature(cloudData) === lastSyncedSig.current) return;
        applyCloudState(cloudData);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      },
      () => {
        // Doc doesn't exist yet
      }
    );

    return () => unsubscribe();
  }, [user, applyCloudState]);

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
      lastSyncedSig.current = syncSignature(stateToSync);
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
