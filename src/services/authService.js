import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

/** Everything that talks to Firebase Authentication. UI code only uses AuthContext / useAuth. */

export const NOT_CONFIGURED_MESSAGE =
  'Authentication is not configured. Copy .env.example to .env.local, fill in your Firebase settings and restart the dev server.';

const MESSAGES = {
  'auth/invalid-email': 'This email address is not valid.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'The password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-blocked': 'The sign-in window was blocked by the browser. Allow pop-ups and try again.',
  'auth/account-exists-with-different-credential': 'An account with this email already exists with another sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console.',
  'auth/unauthorized-domain': 'This domain is not authorised in Firebase (Authentication → Settings → Authorized domains).',
};

// The user simply closed the Google window: not an error worth showing.
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

/** Turns a Firebase error into an Error with a readable message (and `silent` for cancelled pop-ups). */
export function toAuthError(error) {
  const code = error?.code ?? '';
  const result = new Error(MESSAGES[code] ?? 'Something went wrong. Please try again.');
  result.code = code;
  result.silent = SILENT_CODES.has(code);
  return result;
}

function requireAuth() {
  if (!isFirebaseConfigured || !auth) throw new Error(NOT_CONFIGURED_MESSAGE);
  return auth;
}

async function guarded(action) {
  try {
    return await action(requireAuth());
  } catch (error) {
    if (error?.message === NOT_CONFIGURED_MESSAGE) throw error;
    throw toAuthError(error);
  }
}

export function signUpWithEmail(email, password) {
  return guarded(async (instance) => (await createUserWithEmailAndPassword(instance, email.trim(), password)).user);
}

export function signInWithEmail(email, password) {
  return guarded(async (instance) => (await signInWithEmailAndPassword(instance, email.trim(), password)).user);
}

export function signInWithGoogle() {
  return guarded(async (instance) => (await signInWithPopup(instance, googleProvider)).user);
}

export function signOutUser() {
  return guarded((instance) => firebaseSignOut(instance));
}

/**
 * Calls `onUser` with the current user (or null) now and after every sign-in / sign-out, including the
 * restored session after a refresh. Returns the unsubscribe function.
 */
export function subscribeToAuth(onUser, onError) {
  if (!auth) {
    onUser(null);
    return () => {};
  }
  return onAuthStateChanged(auth, onUser, (error) => onError?.(toAuthError(error)));
}
