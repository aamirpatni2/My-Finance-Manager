import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';
import { AppState } from '../types/finance';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Popups are blocked or silently dropped inside Android TWAs and several mobile
// browsers, so those get the redirect flow instead.
function prefersRedirectSignIn(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  const mobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  return standalone || mobile;
}

async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// Completes a redirect sign-in after the browser navigates back into the app.
export async function completeRedirectSignIn(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Redirect sign-in failed:', error);
    return null;
  }
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  if (prefersRedirectSignIn()) {
    // Navigates away; the session is picked up by completeRedirectSignIn on return.
    await signInWithRedirect(auth, googleProvider);
    return new Promise<FirebaseUser>(() => {});
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Ensure user profile document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return user;
  } catch (error) {
    console.error('Failed to sign in with Google:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save user financial data state to Firestore
 */
export async function saveFinancialStateToCloud(
  userId: string,
  state: AppState
): Promise<void> {
  const path = `users/${userId}/financialData/main`;
  try {
    const payload = {
      userId,
      incomes: state.incomes,
      expenses: state.expenses,
      budgetConfig: state.budgetConfig,
      savingsGoals: state.savingsGoals,
      debts: state.debts,
      netWorthItems: state.netWorthItems,
      selectedMonth: state.selectedMonth,
      monthlyReviewNotes: state.monthlyReviewNotes,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId, 'financialData', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user financial data once from Firestore
 */
export async function fetchFinancialStateFromCloud(
  userId: string
): Promise<AppState | null> {
  const path = `users/${userId}/financialData/main`;
  try {
    const docRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      incomes: data.incomes || [],
      expenses: data.expenses || [],
      budgetConfig: data.budgetConfig,
      savingsGoals: data.savingsGoals || [],
      debts: data.debts || [],
      netWorthItems: data.netWorthItems || [],
      selectedMonth: data.selectedMonth,
      monthlyReviewNotes: data.monthlyReviewNotes || {},
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Real-time listener for Firestore financial data updates
 */
export function subscribeToFinancialState(
  userId: string,
  onData: (cloudState: AppState) => void,
  onEmpty?: () => void
): Unsubscribe {
  const path = `users/${userId}/financialData/main`;
  const docRef = doc(db, 'users', userId, 'financialData', 'main');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData({
          incomes: data.incomes || [],
          expenses: data.expenses || [],
          budgetConfig: data.budgetConfig,
          savingsGoals: data.savingsGoals || [],
          debts: data.debts || [],
          netWorthItems: data.netWorthItems || [],
          selectedMonth: data.selectedMonth,
          monthlyReviewNotes: data.monthlyReviewNotes || {},
        });
      } else if (onEmpty) {
        onEmpty();
      }
    },
    (error) => {
      // Must use handleFirestoreError as instructed in SKILL.md
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
