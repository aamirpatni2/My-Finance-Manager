import {
  signInWithPopup,
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

export async function loginWithGoogle(): Promise<FirebaseUser> {
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
