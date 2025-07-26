// src/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyCwY-LSDm9HhL0VhC5WpSSECD3tQ5yaK1c",
  authDomain: "mealmood-app.firebaseapp.com",
  projectId: "mealmood-app",
  storageBucket: "mealmood-app.firebasestorage.app",
  messagingSenderId: "965664993274",
  appId: "1:965664993274:web:41196f8f9c8513a7bd3e43",
  measurementId: "G-CG8JBW6KFK"
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(firebaseApp)