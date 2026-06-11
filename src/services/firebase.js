import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebase = Object.values(FIREBASE_CONFIG).every(Boolean);

let app = null, auth = null, db = null;

if (hasFirebase && !getApps().length) {
  try {
    app  = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db   = getFirestore(app);
  } catch (e) {
    console.error('[Firebase] Init failed:', e);
  }
}

export { auth, db, hasFirebase };
