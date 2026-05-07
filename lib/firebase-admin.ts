import * as admin from 'firebase-admin';

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
};

export const adminApp = getFirebaseAdmin();
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
