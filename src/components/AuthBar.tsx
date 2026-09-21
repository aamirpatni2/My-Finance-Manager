import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, CheckCircle, AlertCircle, User as UserIcon } from 'lucide-react';
import { AppState } from '../types/finance';

interface AuthBarProps {
  currentState: AppState;
}

export const AuthBar: React.FC<AuthBarProps> = ({ currentState }) => {
  const { user, loading, syncStatus, lastSyncedAt, syncError, signIn, signOut, syncNow } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncNow(currentState);
    setIsManualSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 animate-pulse">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden sm:inline">Checking auth...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="google-signin-btn"
          onClick={signIn}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          title="Sign in with your Google account to sync data across devices with Cloud Firestore"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Sign in with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="h-5 w-5 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
            {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
          </div>
        )}

        <span className="max-w-[100px] truncate hidden md:inline font-semibold">
          {user.displayName || user.email?.split('@')[0]}
        </span>

        {/* Sync Status Icon */}
        {syncStatus === 'syncing' || isManualSyncing ? (
          <span title="Syncing with Firestore...">
            <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />
          </span>
        ) : syncStatus === 'synced' ? (
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Firestore Connected & Synced" />
        ) : syncStatus === 'error' ? (
          <span title="Sync issue">
            <AlertCircle className="h-3 w-3 text-rose-500" />
          </span>
        ) : (
          <span title="Offline">
            <CloudOff className="h-3 w-3 text-slate-400" />
          </span>
        )}
      </button>

      {/* Profile & Sync Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {user.displayName || 'Authenticated User'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Cloud Sync Details */}
          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Firestore Cloud Sync
              </span>
              <span
                className={`font-semibold capitalize text-[11px] px-1.5 py-0.5 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {syncStatus}
              </span>
            </div>

            {lastSyncedAt && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Last updated: {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}

            {syncError && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                {syncError}
              </p>
            )}

            <button
              id="manual-sync-btn"
              onClick={handleManualSync}
              disabled={isManualSyncing || syncStatus === 'syncing'}
              className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
            >
              <RefreshCw className={`h-3 w-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
              Sync to Firestore Now
            </button>
          </div>

          {/* Sign Out Button */}
          <button
            id="google-signout-btn"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
