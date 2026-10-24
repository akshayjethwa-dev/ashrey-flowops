// src/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../firebase-applet-config.json';

// Build unified configuration (prefers firebase-applet-config.json, falls back to env vars)
const firebaseConfig = {
  apiKey: appletConfig.apiKey || (import.meta.env?.VITE_FIREBASE_API_KEY as string | undefined),
  authDomain: appletConfig.authDomain || (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string | undefined),
  projectId: appletConfig.projectId || (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string | undefined),
  storageBucket: appletConfig.storageBucket || (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string | undefined),
  messagingSenderId: appletConfig.messagingSenderId || (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined),
  appId: appletConfig.appId || (import.meta.env?.VITE_FIREBASE_APP_ID as string | undefined),
};

const databaseId = appletConfig.firestoreDatabaseId || (import.meta.env?.VITE_FIREBASE_DATABASE_ID as string | undefined);

// Prevent duplicate app initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app); /* CRITICAL: Must use databaseId */
export const storage = getStorage(app);

// Test connection on boot (Phase 1 Validation)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();
