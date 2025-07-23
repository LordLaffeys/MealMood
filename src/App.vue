<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from 'vue'
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

// Import all page and layout components
// In a real project, these would be in separate files e.g., './components/pages/Dashboard.vue'

// ---------------------------
// MOCK DATA (Shared across components)
// ---------------------------
interface Recipe {
  id: number;
  title: string;
  description: string;
  mood: string;
  time: number;
  diet: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  trending: boolean;
  favorite: boolean;
  cuisine: string;
}

// ---------------------------
// MOCK DATA (Shared across components)
// ---------------------------
const mockRecipes = ref<Recipe[]>([
  { id: 4, title: "Avocado Toast with Egg", description: "A simple and satisfying breakfast.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/34d399/ffffff?text=Avocado+Toast", ingredients: ["Bread", "Avocado", "Egg", "Chili Flakes"], instructions: ["Toast your bread.", "Mash avocado on toast.", "Top with a fried egg."], mealType: "Breakfast", trending: true, favorite: true, cuisine: "American" },
  { id: 3, title: "Happy Chicken Salad", description: "A joyful and protein-packed salad.", mood: "Happy", time: 20, diet: "High-Protein", image: "https://placehold.co/600x400/fb923c/ffffff?text=Chicken+Salad", ingredients: ["Chicken", "Lettuce", "Tomatoes", "Avocado", "Vegetables"], instructions: ["Grill chicken breast.", "Chop vegetables.", "Combine and serve."], mealType: "Lunch", trending: true, favorite: false, cuisine: "American" },
  { id: 7, title: "15-Min Lemon Garlic Tilapia", description: "Super fast and light for when you're tired.", mood: "Tired", time: 15, diet: "High-Protein", image: "https://placehold.co/600x400/38bdf8/ffffff?text=Tilapia", ingredients: ["Tilapia", "Fish", "Garlic", "Lemon"], instructions: ["Season tilapia.", "Pan-sear for 3-4 mins per side.", "Squeeze lemon juice over."], mealType: "Dinner", trending: false, favorite: false, cuisine: "American" },
  { id: 1, title: "Hearty Lentil Soup", description: "A warm and comforting soup.", mood: "Stressed", time: 30, diet: "Vegan", image: "https://placehold.co/600x400/f87171/ffffff?text=Lentil+Soup", ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Vegetables"], instructions: ["Sauté vegetables.", "Add lentils and broth.", "Simmer for 25 mins."], mealType: "Dinner", trending: true, favorite: false, cuisine: "Italian" },
  { id: 2, title: "Quinoa Salad", description: "A light and refreshing salad.", mood: "Happy", time: 15, diet: "Vegetarian", image: "https://placehold.co/600x400/4ade80/ffffff?text=Quinoa+Salad", ingredients: ["Quinoa", "Cucumber", "Tomatoes", "Feta", "Vegetables"], instructions: ["Cook quinoa.", "Chop vegetables.", "Combine and dress."], mealType: "Lunch", trending: false, favorite: true, cuisine: "American" },
  { id: 5, title: "Spicy Black Bean Burgers", description: "Flavor-packed burgers.", mood: "Angry", time: 40, diet: "Vegan", image: "https://placehold.co/600x400/a78bfa/ffffff?text=Bean+Burger", ingredients: ["Black Beans", "Breadcrumbs", "Onion", "Spices", "Vegetables"], instructions: ["Mash beans.", "Form patties.", "Cook on a skillet."], mealType: "Dinner", trending: false, favorite: false, cuisine: "Mexican" },
  { id: 6, title: "Creamy Tomato Pasta", description: "Classic comfort food.", mood: "Sad", time: 25, diet: "Vegetarian", image: "https://placehold.co/600x400/f472b6/ffffff?text=Tomato+Pasta", ingredients: ["Pasta", "Tomatoes", "Garlic", "Cream", "Basil"], instructions: ["Cook pasta.", "Make the sauce.", "Combine and serve."], mealType: "Dinner", trending: true, favorite: true, cuisine: "Italian" },
  { id: 8, title: "Greek Yogurt Parfait", description: "A healthy and quick breakfast option.", mood: "Bored", time: 5, diet: "Vegetarian", image: "https://placehold.co/600x400/fde047/ffffff?text=Parfait", ingredients: ["Greek Yogurt", "Granola", "Berries", "Honey"], instructions: ["Layer yogurt, granola, and berries in a glass.", "Drizzle with honey.", "Serve immediately."], mealType: "Breakfast", trending: false, favorite: true, cuisine: "American" },
  { id: 9, title: "Beef and Broccoli", description: "A classic takeout dish made at home.", mood: "Stressed", time: 30, diet: "High-Protein", image: "https://placehold.co/600x400/7c3aed/ffffff?text=Beef+Broccoli", ingredients: ["Beef", "Broccoli", "Soy Sauce", "Ginger", "Garlic", "Rice"], instructions: ["Slice beef thinly.", "Stir-fry beef until browned.", "Add broccoli and sauce, then simmer."], mealType: "Dinner", trending: true, favorite: false, cuisine: "Asian" },
  { id: 10, title: "Caprese Sandwich", description: "A simple and elegant lunch.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/ef4444/ffffff?text=Caprese", ingredients: ["Baguette", "Tomatoes", "Mozzarella", "Basil", "Balsamic Glaze"], instructions: ["Slice baguette, tomatoes, and mozzarella.", "Layer ingredients on the bread.", "Drizzle with balsamic glaze."], mealType: "Lunch", trending: false, favorite: false, cuisine: "Italian" },
  { id: 11, title: "Energizing Smoothie", description: "A green smoothie to kickstart your day.", mood: "Tired", time: 5, diet: "Vegan", image: "https://placehold.co/600x400/22c55e/ffffff?text=Smoothie", ingredients: ["Spinach", "Banana", "Almond Milk", "Protein Powder"], instructions: ["Combine all ingredients in a blender.", "Blend until smooth.", "Enjoy immediately."], mealType: "Breakfast", trending: true, favorite: false, cuisine: "American" },
  { id: 12, title: "Sheet Pan Lemon Herb Chicken", description: "An easy one-pan dinner.", mood: "Tired", time: 45, diet: "High-Protein", image: "https://placehold.co/600x400/f97316/ffffff?text=Sheet+Pan+Chicken", ingredients: ["Chicken", "Potatoes", "Green Beans", "Lemon", "Herbs", "Vegetables"], instructions: ["Toss all ingredients with olive oil and herbs.", "Arrange on a sheet pan.", "Bake at 400°F (200°C) for 30-35 minutes."], mealType: "Dinner", trending: false, favorite: true, cuisine: "American" },
]);

const preferences = ref({
  isVegetarian: localStorage.getItem('isVegetarian') === 'true',
  isVegan: localStorage.getItem('isVegan') === 'true',
  isHalal: localStorage.getItem('isHalal') === 'true',
  hasNutAllergy: localStorage.getItem('hasNutAllergy') === 'true',
  isGlutenFree: localStorage.getItem('isGlutenFree') === 'true',
  hasDairyAllergy: localStorage.getItem('hasDairyAllergy') === 'true',
  hasEggAllergy: localStorage.getItem('hasEggAllergy') === 'true',
  hasFishAllergy: localStorage.getItem('hasFishAllergy') === 'true',
  hasShellfishAllergy: localStorage.getItem('hasShellfishAllergy') === 'true',
});

watch(preferences, (newPrefs) => {
  localStorage.setItem('isVegetarian', newPrefs.isVegetarian.toString())
  localStorage.setItem('isVegan', newPrefs.isVegan.toString())
  localStorage.setItem('hasNutAllergy', newPrefs.hasNutAllergy.toString())
  localStorage.setItem('isGlutenFree', newPrefs.isGlutenFree.toString())
}, { deep: true });

// ---------------------------
// APPLICATION STATE
// ---------------------------
const isAuthenticated = ref(false);
const hasCompletedOnboarding = ref(false);
const currentPage = ref('dashboard');
const selectedRecipe = ref<Recipe | null>(null);
const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

// ---------------------------
// GLOBAL METHODS
// ---------------------------
const navigate = (page: string) => {
  currentPage.value = page;
};

const handleLoginSuccess = () => {
  isAuthenticated.value = true;
  // In a real app, you'd check if the user has completed onboarding from your backend
  // For this mock, we assume a new login requires onboarding.
  hasCompletedOnboarding.value = false; 
};

const handleOnboardingComplete = () => {
  hasCompletedOnboarding.value = true;
  currentPage.value = 'dashboard';
};

const viewRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
};

const toggleFavorite = (recipeId: number) => {
  const recipe = mockRecipes.value.find(r => r.id === recipeId);
  if (recipe) {
    recipe.favorite = !recipe.favorite;
  }
};

// Theme management
watch(isDarkMode, (value) => {
  document.documentElement.classList.toggle('dark', value);
  localStorage.setItem('theme', value ? 'dark' : 'light');
});

onMounted(() => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
  }
});

// Dynamically select which component to show
const activeComponent = computed(() => {
  if (!isAuthenticated.value) return Auth;
  if (!hasCompletedOnboarding.value) return Onboarding;
  
  switch (currentPage.value) {
    case 'dashboard': return Dashboard;
    case 'moodtracker': return MoodTracker;
    case 'recipes': return Recipes;
    case 'profile': return Profile;
    default: return Dashboard;
  }
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
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Render Auth or Onboarding full-screen -->
    <template v-if="!isAuthenticated || !hasCompletedOnboarding">
      <component 
        :is="activeComponent"
        @login-success="handleLoginSuccess"
        @onboarding-complete="handleOnboardingComplete"
        :preferences="preferences"
      />
    </template>
    
    <!-- Main App Layout -->
    <template v-else>
      <Sidebar :currentPage="currentPage" @navigate="navigate" />
      
      <main class="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
        <component 
          :is="activeComponent"
          :recipes="mockRecipes"
          :preferences="preferences"
          :isDarkMode="isDarkMode"
          @view-recipe="viewRecipe"
          @navigate="navigate"
          @toggle-dark-mode="isDarkMode = !isDarkMode"
        />
      </main>
      
      <MobileNav :currentPage="currentPage" @navigate="navigate" />
    </template>

    <!-- Global Recipe Dialog -->
    <RecipeDialog 
      :recipe="selectedRecipe" 
      @close="selectedRecipe = null"
      @toggle-favorite="toggleFavorite"
    />
  </div>
</template>