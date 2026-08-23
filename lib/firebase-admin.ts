import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp: App | null = null;

export function getFirebaseAdmin(): App | null {
  if (firebaseApp) return firebaseApp;

  try {
    if (getApps().length > 0) {
      firebaseApp = getApps()[0];
      return firebaseApp;
    }

    let serviceAccount: Record<string, string> | undefined;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    if (serviceAccount) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      });
      console.log('Firebase Admin initialized (Auth only)');
      return firebaseApp;
    }

    console.warn('Firebase service account not found — Auth operations will be unavailable');
    return null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('Firebase Admin initialization skipped:', msg);
    return null;
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  if (!app) return null;
  return getAuth(app);
}
