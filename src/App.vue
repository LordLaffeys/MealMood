<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useCurrentUser } from 'vuefire'
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, getDoc, collection, addDoc, serverTimestamp, increment  } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import Auth from './pages/Auth.vue'
import Dashboard from './pages/Dashboard.vue'
import MoodTracker from './pages/MoodTracker.vue'
import Recipes from './pages/Recipes.vue'
import Profile from './pages/Profile.vue'
import Sidebar from './components/layout/Sidebar.vue'
import MobileNav from './components/layout/MovileNav.vue'
import RecipeDialog from './components/layout/RecipeDialog.vue'
import Onboarding from './pages/Onboarding.vue'

import { debounce } from 'lodash'

// Toast system
const toast = ref({
  show: false,
  message: '',
  description: '',
  type: 'success' as 'success' | 'error'
});

const showToast = (type: 'success' | 'error', message: string, description: string) => {
  toast.value = {
    show: true,
    message,
    description,
    type
  };
  
  setTimeout(() => {
    toast.value.show = false;
  }, 4000);
};

// Provide toast function to all child components
provide('showToast', showToast);

// Helper function to create initial user data
const createInitialUserData = (email: string, name: string | null) => ({
  email: email,
  name: name || '',
  preferences: {
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isHalal: false,
    isLactoseIntolerant: false,
    cuisines: {
      Javanese: false,
      Padang: false,
      Sundanese: false,
      ChineseIndonesian: false,
      ComfortFood: false,
      Japanese: false,
      SpicyFood: false,
      StreetFood: false,
      Nusantara: false,
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
  hasCompletedOnboarding: false,
});

// ---------------------------
// FIRESTORE RECIPE DATA
// ---------------------------
interface Recipe {
  id: number;
  title: string;
  description: string;
  mood: string;
  time: string;
  diet: string[];
  image: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  cuisine: {
    Javanese: boolean;
    Padang: boolean;
    Sundanese: boolean;
    Nusantara: boolean;
    ComfortFood: boolean;
    Japanese: boolean;
    SpicyFood: boolean;
    StreetFood: boolean;
    ChineseIndonesian: boolean;
  };
  allergyWarning: {
    isNutAllergy: boolean;
    isDairyAllergy: boolean;
    isEggAllergy: boolean;
    isFishAllergy: boolean;
    isShellfishAllergy: boolean;
  };
  // Recipe stats fields
  trendingScore?: number;
  pickCount?: number;
  favoriteCount?: number;
  unfavoriteCount?: number;
  favorite?: boolean; // This will be managed locally or in user's favorites
  // trending?: boolean; // This can be computed based on trendingScore
}

// Initialize Firestore
const db = getFirestore();

// Use VueFire to get recipes from Firestore
const recipesCollection = collection(db, 'recipes');
const { data: firestoreRecipes, pending: recipesLoading, error: recipesError } = useCollection(recipesCollection);

// Transform Firestore recipes to include local state like favorites
const recipes = computed(() => {
  if (!firestoreRecipes.value) return [];
  
  return firestoreRecipes.value.map(recipe => ({
    ...recipe,
    favorite: userFavorites.value.includes(recipe.id) || false,
    trendingScore: recipe.trendingScore ?? 0,
    pickCount: recipe.pickCount ?? 0,
    favoriteCount: recipe.favoriteCount ?? 0,
    unfavoriteCount: recipe.unfavoriteCount ?? 0
    // trending: (recipe.trendingScore || 0) > 50 // Mark as trending if trendingScore > 50
  })) as Recipe[];
});

// ---------------------------
// APPLICATION STATE
// ---------------------------
const user = useCurrentUser();
const isAuthenticated = computed(() => !!user.value); 

// Loading states
const isAuthLoading = ref(true);
const isDataLoading = ref(true);
const isAppReady = ref(false);

// User state from Firestore
const preferences = ref({});
const allergies = ref({}); // Add allergies to the app state
const hasCompletedOnboarding = ref(false);
const isDarkMode = ref(false);
const userFavorites = ref<number[]>([]);

const currentPage = ref('dashboard');
const selectedRecipe = ref<Recipe | null>(null);

// Enhanced user document creation and data sync
watch(user, async (currentUser) => {
  if (currentUser) {
    console.log('User authenticated:', currentUser.email);
    isAuthLoading.value = false;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Create user document if it doesn't exist
      if (!userDoc.exists()) {
        console.log('Creating new user document...');
        const initialData = createInitialUserData(
          currentUser.email || '',
          currentUser.displayName
        );
        await setDoc(userDocRef, initialData);
        console.log('User document created');
      }
      
      // Set up real-time listener
      onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('User data loaded:', data);
          
          preferences.value = data.preferences || {};
          allergies.value = data.allergies || {}; // Load allergies too
          isDarkMode.value = data.darkMode || false;
          hasCompletedOnboarding.value = data.hasCompletedOnboarding || false;
          userFavorites.value = data.favoriteRecipes || [];
          
          // Mark data as loaded
          isDataLoading.value = false;
          isAppReady.value = true;
        } else {
          console.log('User document does not exist');
          hasCompletedOnboarding.value = false;
          isDataLoading.value = false;
          isAppReady.value = true;
        }
      }, (error) => {
        console.error('Error listening to user document:', error);
        isDataLoading.value = false;
        isAppReady.value = true;
      });
    } catch (error) {
      console.error('Error setting up user document:', error);
      isDataLoading.value = false;
      isAppReady.value = true;
    }
  } else {
    console.log('User not authenticated');
    // Reset state when user logs out
    preferences.value = {};
    allergies.value = {};
    isDarkMode.value = false;
    hasCompletedOnboarding.value = false;
    userFavorites.value = [];
    isAuthLoading.value = false;
    isDataLoading.value = false;
    isAppReady.value = true;
  }
}, { immediate: true });

// Save changes back to Firestore
const debouncedUpdateUserDoc = debounce((data: object) => {
  if (user.value) {
    const userDocRef = doc(db, 'users', user.value.uid);
    updateDoc(userDocRef, data).catch(error => console.error("Error updating document: ", error));
  }
}, 1000);

watch(preferences, (newPrefs) => {
  if (isAppReady.value) {
    debouncedUpdateUserDoc({ preferences: newPrefs });
  }
}, { deep: true });

watch(allergies, (newAllergies) => {
  if (isAppReady.value) {
    debouncedUpdateUserDoc({ allergies: newAllergies });
  }
}, { deep: true });

watch(isDarkMode, (newVal) => {
  document.documentElement.classList.toggle('dark', newVal);
  if (isAppReady.value) {
    debouncedUpdateUserDoc({ darkMode: newVal });
  }
});

watch(userFavorites, (newFavorites) => {
  if (isAppReady.value) {
    debouncedUpdateUserDoc({ favoriteRecipes: newFavorites });
  }
}, { deep: true });

// ---------------------------
// GLOBAL METHODS
// ---------------------------
const navigate = (page: string) => {
  currentPage.value = page;
};

// Event handlers
const handleLoginSuccess = () => {
  console.log('Login success event received');
};

const handleOnboardingRequired = () => {
  console.log('Onboarding required event received');
};

// FIXED: Properly handle onboarding completion data structure
const handleOnboardingComplete = async (userData: any) => {
  console.log('Onboarding complete with data:', userData);
  
  if (user.value) {
    try {
      const userDocRef = doc(db, 'users', user.value.uid);
      
      // FIXED: Save the data in the correct structure
      await updateDoc(userDocRef, { 
        hasCompletedOnboarding: true,
        preferences: userData.preferences,  // Save preferences correctly
        allergies: userData.allergies       // Save allergies correctly
      });
      
      console.log('Onboarding data saved successfully');
      showToast('success', 'Welcome to MealMood!', 'Your preferences have been saved.');
      
      currentPage.value = 'dashboard';
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      showToast('error', 'Error', 'Failed to save your preferences. Please try again.');
    }
  }
};

const viewRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
};

const toggleFavorite = async (recipeId: number) => {
  if (!user.value) {
    showToast('error', 'Error', 'You must be logged in to favorite recipes.');
    return;
  }

  try {
    const index = userFavorites.value.indexOf(recipeId);
    const recipeDocRef = doc(db, 'recipes', recipeId.toString());
    
    if (index === -1) {
      // Adding to favorites
      userFavorites.value.push(recipeId);
      
      // Update recipe stats: favoriteCount +1, trendingScore +10
      await updateDoc(recipeDocRef, {
        favoriteCount: increment(1),
        trendingScore: increment(10)
      });
      
      showToast('success', 'Added to Favorites!', 'Recipe has been added to your favorites.');
      console.log('Recipe favorited: favoriteCount +1, trendingScore +10');
    } else {
      // Removing from favorites
      userFavorites.value.splice(index, 1);
      
      // Update recipe stats: unfavoriteCount +1 (no change to trendingScore)
      await updateDoc(recipeDocRef, {
        unfavoriteCount: increment(1)
      });
      
      showToast('success', 'Removed from Favorites', 'Recipe has been removed from your favorites.');
      console.log('Recipe unfavorited: unfavoriteCount +1');
    }
  } catch (error) {
    console.error('Error updating favorite status:', error);
    showToast('error', 'Error', 'Failed to update favorite status. Please try again.');
  }
};

// NEW: Handle recipe picking and mood logging
const pickRecipe = async (recipe: Recipe) => {
  if (!user.value) {
    showToast('error', 'Error', 'You must be logged in to pick a recipe.');
    return;
  }

  try {
    // Add mood log to Firestore
    const moodLogsCollection = collection(db, 'moodLogs');
    await addDoc(moodLogsCollection, {
      userId: user.value.uid,
      recipeId: recipe.id.toString(), // Convert to string if needed
      mood: recipe.mood,
      timestamp: serverTimestamp()
    });

    // Update recipe stats: pickCount +1, trendingScore +1
    const recipeDocRef = doc(db, 'recipes', recipe.id.toString());
    await updateDoc(recipeDocRef, {
      pickCount: increment(1),
      trendingScore: increment(1)
    });

    // Close the dialog
    selectedRecipe.value = null;
    
    // Show success toast
    showToast('success', 'Recipe Picked!', `Great choice! We've logged your ${recipe.mood.toLowerCase()} mood.`);
    
    console.log('Mood log saved successfully for recipe:', recipe.title);
    console.log('Recipe stats updated: pickCount +1, trendingScore +1');
  } catch (error) {
    console.error('Error saving mood log or updating recipe stats:', error);
    showToast('error', 'Error', 'Failed to pick recipe. Please try again.');
  }
};

// Enhanced component selection with loading states
const activeComponent = computed(() => {
  // Don't show anything until we're ready
  if (!isAppReady.value || recipesLoading.value) {
    return null; // Will show loading screen
  }
  
  if (!isAuthenticated.value) {
    return Auth;
  }
  
  // If authenticated, check onboarding status
  if (!hasCompletedOnboarding.value) {
    return Onboarding;
  }
  
  // If authenticated and onboarding completed, show the current page
  switch (currentPage.value) {
    case 'dashboard': return Dashboard;
    case 'moodtracker': return MoodTracker;
    case 'recipes': return Recipes;
    case 'profile': return Profile;
    default: return Dashboard;
  }
});

// Create a combined preferences object to pass to components
const combinedUserData = computed(() => ({
  preferences: preferences.value,
  allergies: allergies.value,
  isDarkMode: isDarkMode.value
}));

onMounted(() => {
  console.log('App mounted');
});
</script>

<template>
  <div class="h-screen w-full bg-background text-foreground flex overflow-hidden">
    <!-- Global Toast Component - Always at the top level -->
    <div 
      v-if="toast.show"
      class="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out"
      :class="toast.type === 'success' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <!-- Success Icon -->
            <svg v-if="toast.type === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <!-- Error Icon -->
            <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ toast.message }}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ toast.description }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="toast.show = false"
              class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span class="sr-only">Close</span>
              <svg class="h-4 w-4" viewBox="0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Screen -->
    <div v-if="!isAppReady || recipesLoading" class="w-full h-full flex items-center justify-center bg-background">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 class="text-2xl font-bold text-primary mb-2">MealMood</h2>
        <p class="text-muted-foreground">Loading your personalized experience...</p>
        <div v-if="recipesError" class="mt-4 text-red-500">
          <p>Error loading recipes: {{ recipesError.message }}</p>
        </div>
      </div>
    </div>

    <!-- Only render content when app is ready -->
    <template v-else>
      <!-- Render Auth or Onboarding full-screen -->
      <template v-if="!isAuthenticated || !hasCompletedOnboarding">
        <component 
          :is="activeComponent"
          @login-success="handleLoginSuccess"
          @onboarding-required="handleOnboardingRequired"
          @onboarding-complete="handleOnboardingComplete"
          :preferences="combinedUserData"
        />
      </template>
      
      <!-- Main App Layout -->
      <template v-else>
        <Sidebar :currentPage="currentPage" @navigate="navigate" />
        
        <main class="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
          <component 
            :is="activeComponent"
            :recipes="recipes"
            :preferences="combinedUserData"
            :isDarkMode="isDarkMode"
            @view-recipe="viewRecipe"
            @navigate="navigate"
            @toggle-dark-mode="isDarkMode = !isDarkMode"
          />
        </main>
        
        <MobileNav :currentPage="currentPage" @navigate="navigate" />
      </template>
    </template>

    <!-- Global Recipe Dialog -->
    <RecipeDialog 
      :recipe="selectedRecipe" 
      @close="selectedRecipe = null"
      @toggle-favorite="toggleFavorite"
      @pick-recipe="pickRecipe"
    />
  </div>
</template>