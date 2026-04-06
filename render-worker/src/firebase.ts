import * as admin from "firebase-admin";

// Initialize Firebase Admin with Application Default Credentials
// This works automatically in Google Cloud Run
if (!admin.apps.length) {
  admin.initializeApp({
    // Replace with your project ID if not automated by environment
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "lkmovie01",
    // Replace with your bucket name
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "lkmovie01.appspot.com"
  });
}

const firestore = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

export { admin, firestore, storage, bucket };
