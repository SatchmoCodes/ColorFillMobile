// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCusZ-giht0y9F8SlGq03bb8hlIyje3Kfg",
  authDomain: "colorfill-6d541.firebaseapp.com",
  databaseURL: "https://colorfill-6d541-default-rtdb.firebaseio.com",
  projectId: "colorfill-6d541",
  storageBucket: "colorfill-6d541.appspot.com",
  messagingSenderId: "748210238503",
  appId: "1:748210238503:web:ce401caec82e4172ec4a02",
  measurementId: "G-6LSQJGV743"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const FIREBASE_APP = initializeApp(firebaseConfig)
export const FIRESTORE_DB = getFirestore(FIREBASE_APP)
export const FIREBASE_AUTH = getAuth(FIREBASE_APP)
