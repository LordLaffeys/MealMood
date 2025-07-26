<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Firebase imports
import { useFirebaseAuth, useCurrentUser } from 'vuefire';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { getApp } from 'firebase/app'; // Import getApp to get the initialized Firebase app

// Inject the global toast functions
const showToast = inject('showToast') as (type: 'success' | 'error', message: string, description: string) => void;
const showMultipleToasts = inject('showMultipleToasts') as (toastArray: Array<{ type: 'success' | 'error', message: string, description: string }>) => void;

const emit = defineEmits(['login-success']);
const authPage = ref('login'); // 'login' or 'signup'

// Firebase auth and Firestore
const auth = useFirebaseAuth()!;
const user = useCurrentUser();
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(getApp());

// Helper function to create initial user data for Firestore
const initialUserData = (email: string, name: string | null) => ({
  email: email,
  name: name || '',
  hasCompletedOnboarding: false,
  preferences: {
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isHalal: false,
    isLactoseIntolerant: false,
    // Add the cuisines object here
    cuisines: {
      Javanese: false,
      Padang: false,
      Sundanese: false,
      ChineseIndonesian: false,
      ComfortFood: false,
      Japanese: false,
      SpicyFood: false,
      StreetFood: false,
    }
  },
  allergies: {
    isNutAllergy: false,
    isDairyAllergy: false,
    isEggAllergy: false,
    isFishAllergy: false,
    isShellfishAllergy: false,
  },
  favoriteRecipes: [],
  lastPickedRecipes: [],
  darkMode: false,
});

// Loading states
const isLoading = ref(false);
const isGoogleLoading = ref(false);

// --- Refs for Login Form ---
const loginEmail = ref('');
const loginPassword = ref('');

// --- Refs for Sign Up Form ---
const signUpName = ref('');
const signUpEmail = ref('');
const signUpPassword = ref('');
const signUpConfirmPassword = ref('');
const signUpTerms = ref(false);

// --- Validation Logic ---
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isSignUpFormInvalid = computed(() => {
  return (
    !signUpName.value ||
    !signUpEmail.value ||
    !signUpPassword.value ||
    !signUpConfirmPassword.value ||
    !signUpTerms.value
  );
});

// Google Sign In
const handleGoogleSignIn = async () => {
  if (isGoogleLoading.value) return;
  
  isGoogleLoading.value = true;
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // --- CHANGE: Simplified Firestore path ---
    const userDocRef = doc(db, `users/${user.uid}`);
    // --- END CHANGE ---
    
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, initialUserData(user.email || '', user.displayName));
      showToast('success', 'Account Created!', 'Welcome to MealMood!');
    } else {
      showToast('success', 'Welcome Back!', `Successfully signed in with Google as ${user.displayName || user.email}`);
    }
    
    emit('login-success');
  } catch (error: any) {
    console.error('Google sign in error:', error);
    let errorMessage = 'Failed to sign in with Google';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign in was cancelled';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Popup was blocked by browser';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error occurred';
        break;
      default:
        errorMessage = error.message || 'An unexpected error occurred';
    }
    
    showToast('error', 'Google Sign In Failed', errorMessage);
  } finally {
    isGoogleLoading.value = false;
  }
};

// Email/Password Login
const handleLogin = async () => {
  const errors = [];
  
  // Collect all login validation errors
  if (!loginEmail.value) {
    errors.push({
      type: 'error' as const,
      message: 'Email Required',
      description: 'Please enter your email address.'
    });
  }
  
  if (!loginPassword.value) {
    errors.push({
      type: 'error' as const,
      message: 'Password Required',
      description: 'Please enter your password.'
    });
  }
  
//   If there are errors, show them all
  if (errors.length > 0) {
    showMultipleToasts(errors);
    return;
  }
  
  if (isLoading.value) return;
  isLoading.value = true;
  
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    showToast('success', 'Login Successful!', 'Welcome back to MealMood.');
    emit('login-success');
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Please check your credentials and try again';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection';
        break;
      default:
        errorMessage = error.message || 'An unexpected error occurred';
    }
    
    showToast('error', 'Login Failed', errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// Email/Password Sign Up
const handleSignUp = async () => {
  const errors = [];
  
  // 1. Check if all required fields are filled
  if (!signUpName.value) {
    errors.push({
      type: 'error' as const,
      message: 'Name Required',
      description: 'Please enter your full name.'
    });
  }
  
  if (!signUpEmail.value) {
    errors.push({
      type: 'error' as const,
      message: 'Email Required',
      description: 'Please enter your email address.'
    });
  }
  
  if (!signUpPassword.value) {
    errors.push({
      type: 'error' as const,
      message: 'Password Required',
      description: 'Please enter a password.'
    });
  }
  
  if (!signUpConfirmPassword.value) {
    errors.push({
      type: 'error' as const,
      message: 'Confirm Password Required',
      description: 'Please confirm your password.'
    });
  }
  
  if (!signUpTerms.value) {
    errors.push({
      type: 'error' as const,
      message: 'Terms Agreement Required',
      description: 'You must agree to the Terms and Conditions.'
    });
  }
  
  // 2. Email Validation (only if email is provided)
  if (signUpEmail.value && !emailRegex.test(signUpEmail.value)) {
    errors.push({
      type: 'error' as const,
      message: 'Invalid Email Format',
      description: 'Please enter a valid email address (e.g., user@example.com).'
    });
  }

  // 3. Password Complexity Validation (only if password is provided)
  if (signUpPassword.value && !passwordRegex.test(signUpPassword.value)) {
    errors.push({
      type: 'error' as const,
      message: 'Weak Password',
      description: 'Password must be at least 8 characters atleast with a uppercase letter, number, and symbol (@$!%*?&_#).'
    });
  }

  // 4. Password Match Validation (only if both passwords are provided)
  if (signUpPassword.value && signUpConfirmPassword.value && signUpPassword.value !== signUpConfirmPassword.value) {
    errors.push({
      type: 'error' as const,
      message: 'Password Mismatch',
      description: 'The passwords you entered do not match.'
    });
  }
  
  // If there are validation errors, show them all
  if (errors.length > 0) {
    showMultipleToasts(errors);
    return;
  }
  
  if (isLoading.value) return;
  isLoading.value = true;
  
  try {
    // Create user account - Firebase automatically logs the user in upon creation
    const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail.value, signUpPassword.value);
    
    // Update user profile with name
    await updateProfile(userCredential.user, {
      displayName: signUpName.value
    });

    // --- CHANGE: Simplified Firestore path ---
    const userDocRef = doc(db, `users/${userCredential.user.uid}`);
    // --- END CHANGE ---
    
    await setDoc(userDocRef, initialUserData(signUpEmail.value, signUpName.value));
    
    showToast('success', 'Account Created!', 'Welcome to MealMood!');
    // Emit login-success to trigger navigation in App.vue
    emit('login-success');
    
    // Reset form fields after successful signup
    signUpName.value = '';
    signUpEmail.value = '';
    signUpPassword.value = '';
    signUpConfirmPassword.value = '';
    signUpTerms.value = false;
    
  } catch (error: any) {
    console.error('Sign up error:', error);
    let errorMessage = 'Failed to create account';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection';
        break;
      default:
        errorMessage = error.message || 'An unexpected error occurred';
    }
    
    showToast('error', 'Sign Up Failed', errorMessage);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
    <div class="flex flex-col items-center gap-8">
      <div class="text-center">
        <h1 class="text-7xl font-extrabold text-primary dark:text-primary-400 tracking-tight">MealMood</h1>
      </div>
      
      <!-- Login Page -->
      <Card v-if="authPage === 'login'" class="w-full max-w-sm">
        <CardHeader class="text-center">
          <CardTitle class="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to MealMood</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Google Sign In Button -->
          <Button 
            @click="handleGoogleSignIn" 
            :disabled="isGoogleLoading || isLoading"
            variant="outline" 
            class="w-full"
          >
            <svg v-if="!isGoogleLoading" role="img" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
              <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.32 0 2.42.45 3.31 1.22l2.3-2.3c-1.43-1.39-3.26-2.2-5.61-2.2-4.61 0-8.41 3.55-8.41 7.91s3.8 7.91 8.41 7.91c2.44 0 4.28-.83 5.77-2.32 1.54-1.54 2.11-3.75 2.11-5.92 0-.52-.05-1.04-.12-1.54h-9.4v.01z"></path>
            </svg>
            <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            {{ isGoogleLoading ? 'Signing in...' : 'Sign in with Google' }}
          </Button>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              v-model="loginEmail"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              v-model="loginPassword"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <Button 
            @click="handleLogin" 
            :disabled="isLoading || isGoogleLoading"
            class="w-full"
          >
            <div v-if="isLoading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Don't have an account? 
            <Button 
              variant="link" 
              class="p-0 h-auto" 
              @click="authPage = 'signup'"
              :disabled="isLoading || isGoogleLoading"
            >
              Sign Up
            </Button>
          </p>
        </CardContent>
      </Card>

      <!-- Sign Up Page -->
      <Card v-if="authPage === 'signup'" class="w-full max-w-sm">
        <CardHeader class="text-center">
          <CardTitle class="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join MealMood to get personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Google Sign Up Button -->
          <Button 
            @click="handleGoogleSignIn"
            :disabled="isGoogleLoading || isLoading"
            variant="outline" 
            class="w-full"
          >
            <svg v-if="!isGoogleLoading" role="img" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
              <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.32 0 2.42.45 3.31 1.22l2.3-2.3c-1.43-1.39-3.26-2.2-5.61-2.2-4.61 0-8.41 3.55-8.41 7.91s3.8 7.91 8.41 7.91c2.44 0 4.28-.83 5.77-2.32 1.54-1.54 2.11-3.75 2.11-5.92 0-.52-.05-1.04-.12-1.54h-9.4v.01z"></path>
            </svg>
            <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            {{ isGoogleLoading ? 'Signing up...' : 'Sign Up with Google' }}
          </Button>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input 
              id="name" 
              placeholder="Alex Doe" 
              v-model="signUpName"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="space-y-2">
            <Label for="email-signup">Email</Label>
            <Input 
              id="email-signup" 
              type="email" 
              placeholder="m@example.com" 
              v-model="signUpEmail"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="space-y-2">
            <Label for="password-signup">Password</Label>
            <Input 
              id="password-signup" 
              type="password" 
              v-model="signUpPassword"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="space-y-2">
            <Label for="confirm-password-signup">Confirm Password</Label>
            <Input 
              id="confirm-password-signup" 
              type="password" 
              v-model="signUpConfirmPassword"
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="items-top flex space-x-2">
            <Checkbox 
              id="terms" 
              v-model="signUpTerms"
              :disabled="isLoading || isGoogleLoading"
            />
            <Label for="terms" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the Terms and Conditions
            </Label>
          </div>
          <Button 
            @click="handleSignUp" 
            :disabled="isSignUpFormInvalid || isLoading || isGoogleLoading" 
            class="w-full"
          >
            <div v-if="isLoading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Already have an account? 
            <Button 
              variant="link" 
              class="p-0 h-auto" 
              @click="authPage = 'login'"
              :disabled="isLoading || isGoogleLoading"
            >
              Sign In
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
