<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Inject the global toast functions
const showToast = inject('showToast') as (type: 'success' | 'error', message: string, description: string) => void;
const showMultipleToasts = inject('showMultipleToasts') as (toastArray: Array<{ type: 'success' | 'error', message: string, description: string }>) => void;

const emit = defineEmits(['login-success']);
const authPage = ref('login'); // 'login' or 'signup'

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

// Regex for password: at least 8 characters, 1 letter, 1 number, 1 symbol
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/;
// Regex for basic email validation
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

const handleLogin = () => {
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
  
  // If there are errors, show them all
  if (errors.length > 0) {
    showMultipleToasts(errors);
    return;
  }
  
  // If no errors, show success
  showToast('success', 'Login Successful!', 'Welcome back to MealMood.');
  emit('login-success');
};

const handleSignUp = () => {
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
      description: 'Password must be at least 8 characters with a letter, number, and symbol (@$!%*?&_#).'
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

  // If all validations pass
  showToast('success', 'Account Created!', 'Please log in with your new credentials.');
  authPage.value = 'login';
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
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" v-model="loginEmail" />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" v-model="loginPassword" />
          </div>
          <Button @click="handleLogin" class="w-full">Sign In</Button>
          <p class="text-center text-sm text-muted-foreground">
            Don't have an account? 
            <Button variant="link" class="p-0 h-auto" @click="authPage = 'signup'">Sign Up</Button>
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
          <Button variant="outline" class="w-full">
            <svg role="img" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
              <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.32 0 2.42.45 3.31 1.22l2.3-2.3c-1.43-1.39-3.26-2.2-5.61-2.2-4.61 0-8.41 3.55-8.41 7.91s3.8 7.91 8.41 7.91c2.44 0 4.28-.83 5.77-2.32 1.54-1.54 2.11-3.75 2.11-5.92 0-.52-.05-1.04-.12-1.54h-9.4v.01z"></path>
            </svg>
            Sign Up with Google
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
            <Input id="name" placeholder="Alex Doe" v-model="signUpName" />
          </div>
          <div class="space-y-2">
            <Label for="email-signup">Email</Label>
            <Input id="email-signup" type="email" placeholder="m@example.com" v-model="signUpEmail" />
          </div>
          <div class="space-y-2">
            <Label for="password-signup">Password</Label>
            <Input id="password-signup" type="password" v-model="signUpPassword" />
          </div>
          <div class="space-y-2">
            <Label for="confirm-password-signup">Confirm Password</Label>
            <Input id="confirm-password-signup" type="password" v-model="signUpConfirmPassword" />
          </div>
          <div class="items-top flex space-x-2">
            <Checkbox id="terms" v-model="signUpTerms" />
            <Label for="terms" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the Terms and Conditions
            </Label>
          </div>
          <Button @click="handleSignUp" :disabled="isSignUpFormInvalid" class="w-full">Create Account</Button>
          <p class="text-center text-sm text-muted-foreground">
            Already have an account? 
            <Button variant="link" class="p-0 h-auto" @click="authPage = 'login'">Sign In</Button>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>