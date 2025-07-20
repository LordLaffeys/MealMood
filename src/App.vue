<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash'
import { Home, UtensilsCrossed, Smile, User, Search, Heart, Soup, Salad, Pizza, Clock, Leaf, WheatOff, Drumstick, Sun, Moon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import { Checkbox } from '@/components/ui/checkbox'

const isAuthenticated = ref(false) // Controls whether to show the app or the auth pages
const authPage = ref('login') // Can be 'login' or 'signup'

// --- State and Data ---
const currentPage = ref('dashboard')

const mockRecipes = ref([
  { id: 4, title: "Avocado Toast with Egg", description: "A simple and satisfying breakfast.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/34d399/ffffff?text=Avocado+Toast", ingredients: ["Bread", "Avocado", "Egg", "Chili Flakes"], instructions: ["Toast your bread.", "Mash avocado on toast.", "Top with a fried egg."], mealType: "Breakfast", trending: true, favorite: true },
  { id: 3, title: "Happy Chicken Salad", description: "A joyful and protein-packed salad.", mood: "Happy", time: 20, diet: "High-Protein", image: "https://placehold.co/600x400/fb923c/ffffff?text=Chicken+Salad", ingredients: ["Chicken", "Lettuce", "Tomatoes", "Avocado", "Vegetables"], instructions: ["Grill chicken breast.", "Chop vegetables.", "Combine and serve."], mealType: "Lunch", trending: true, favorite: false },
  { id: 7, title: "15-Min Lemon Garlic Tilapia", description: "Super fast and light for when you're tired.", mood: "Tired", time: 15, diet: "High-Protein", image: "https://placehold.co/600x400/38bdf8/ffffff?text=Tilapia", ingredients: ["Tilapia", "Fish", "Garlic", "Lemon"], instructions: ["Season tilapia.", "Pan-sear for 3-4 mins per side.", "Squeeze lemon juice over."], mealType: "Dinner", trending: false, favorite: false },
  { id: 1, title: "Hearty Lentil Soup", description: "A warm and comforting soup.", mood: "Stressed", time: 30, diet: "Vegan", image: "https://placehold.co/600x400/f87171/ffffff?text=Lentil+Soup", ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Vegetables"], instructions: ["Sauté vegetables.", "Add lentils and broth.", "Simmer for 25 mins."], mealType: "Dinner", trending: true, favorite: false },
  { id: 2, title: "Quinoa Salad", description: "A light and refreshing salad.", mood: "Happy", time: 15, diet: "Vegetarian", image: "https://placehold.co/600x400/4ade80/ffffff?text=Quinoa+Salad", ingredients: ["Quinoa", "Cucumber", "Tomatoes", "Feta", "Vegetables"], instructions: ["Cook quinoa.", "Chop vegetables.", "Combine and dress."], mealType: "Lunch", trending: false, favorite: true },
  { id: 5, title: "Spicy Black Bean Burgers", description: "Flavor-packed burgers.", mood: "Energized", time: 40, diet: "Vegan", image: "https://placehold.co/600x400/a78bfa/ffffff?text=Bean+Burger", ingredients: ["Black Beans", "Breadcrumbs", "Onion", "Spices", "Vegetables"], instructions: ["Mash beans.", "Form patties.", "Cook on a skillet."], mealType: "Dinner", trending: false, favorite: false },
  { id: 6, title: "Creamy Tomato Pasta", description: "Classic comfort food.", mood: "Stressed", time: 25, diet: "Vegetarian", image: "https://placehold.co/600x400/f472b6/ffffff?text=Tomato+Pasta", ingredients: ["Pasta", "Tomatoes", "Garlic", "Cream", "Basil"], instructions: ["Cook pasta.", "Make the sauce.", "Combine and serve."], mealType: "Dinner", trending: true, favorite: true },
  { id: 8, title: "Greek Yogurt Parfait", description: "A healthy and quick breakfast option.", mood: "Energized", time: 5, diet: "Vegetarian", image: "https://placehold.co/600x400/fde047/ffffff?text=Parfait", ingredients: ["Greek Yogurt", "Granola", "Berries", "Honey"], instructions: ["Layer yogurt, granola, and berries in a glass.", "Drizzle with honey.", "Serve immediately."], mealType: "Breakfast", trending: false, favorite: true },
  { id: 9, title: "Beef and Broccoli", description: "A classic takeout dish made at home.", mood: "Stressed", time: 30, diet: "High-Protein", image: "https://placehold.co/600x400/7c3aed/ffffff?text=Beef+Broccoli", ingredients: ["Beef", "Broccoli", "Soy Sauce", "Ginger", "Garlic", "Rice"], instructions: ["Slice beef thinly.", "Stir-fry beef until browned.", "Add broccoli and sauce, then simmer."], mealType: "Dinner", trending: true, favorite: false },
  { id: 10, title: "Caprese Sandwich", description: "A simple and elegant lunch.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/ef4444/ffffff?text=Caprese", ingredients: ["Baguette", "Tomatoes", "Mozzarella", "Basil", "Balsamic Glaze"], instructions: ["Slice baguette, tomatoes, and mozzarella.", "Layer ingredients on the bread.", "Drizzle with balsamic glaze."], mealType: "Lunch", trending: false, favorite: false },
  { id: 11, title: "Energizing Smoothie", description: "A green smoothie to kickstart your day.", mood: "Tired", time: 5, diet: "Vegan", image: "https://placehold.co/600x400/22c55e/ffffff?text=Smoothie", ingredients: ["Spinach", "Banana", "Almond Milk", "Protein Powder"], instructions: ["Combine all ingredients in a blender.", "Blend until smooth.", "Enjoy immediately."], mealType: "Breakfast", trending: true, favorite: false },
  { id: 12, title: "Sheet Pan Lemon Herb Chicken", description: "An easy one-pan dinner.", mood: "Tired", time: 45, diet: "High-Protein", image: "https://placehold.co/600x400/f97316/ffffff?text=Sheet+Pan+Chicken", ingredients: ["Chicken", "Potatoes", "Green Beans", "Lemon", "Herbs", "Vegetables"], instructions: ["Toss all ingredients with olive oil and herbs.", "Arrange on a sheet pan.", "Bake at 400°F (200°C) for 30-35 minutes."], mealType: "Dinner", trending: false, favorite: true },
])

type Recipe = typeof mockRecipes.value[0]
const selectedRecipe = ref<Recipe | null>(null)

const viewRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe
}

const toggleFavorite = (recipeId: number) => {
  const recipe = mockRecipes.value.find(r => r.id === recipeId)
  if (recipe) {
    recipe.favorite = !recipe.favorite
    // Removed toast notification; favorite status is now indicated by UI only
  }
}

// 2. Added placeholder functions to simulate login and sign-up.
const handleLogin = () => {
  // In a real app, you would validate credentials here.
  isAuthenticated.value = true;
  toast.success('Login Successful!', { description: 'Welcome back to MealMood.' });
}

const handleSignUp = () => {
  // In a real app, you would create the user account here.
  toast.success('Account Created!', { description: 'Please log in with your new credentials.' });
  authPage.value = 'login'; // Redirect to login page
}

// --- Theme Management ---
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

watch(isDarkMode, (value) => {
  document.documentElement.classList.toggle('dark', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
})

onMounted(() => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  }
})

// --- Dashboard Data ---
const dashboardMealType = ref('Breakfast')
const trendingRecipes = computed(() => mockRecipes.value.filter(r => r.trending))
const lastPickedRecipe = computed(() => mockRecipes.value[2])
const quickPicks = computed(() => mockRecipes.value.filter(r => r.mealType === dashboardMealType.value).slice(0, 5))
const favoriteRecipes = computed(() => mockRecipes.value.filter(r => r.favorite))

// --- MoodTracker Data ---
const selectedMood = ref<string | null>(null)
const ingredientText = ref('')
const ingredientError = ref('')
const ingredientKeywords = ['Chicken', 'Fish', 'Beef', 'Vegetables', 'Pasta', 'Rice']
const activeIngredientKeywords = ref<string[]>([])

const toggleIngredient = (keyword: string) => {
  const index = activeIngredientKeywords.value.indexOf(keyword)
  if (index === -1) {
    activeIngredientKeywords.value.push(keyword)
  } else {
    activeIngredientKeywords.value.splice(index, 1)
  }
}

const handleMoodSelect = (moodName: string) => {
  selectedMood.value = moodName
  activeIngredientKeywords.value = []
  ingredientText.value = ''
}

watch(ingredientText, (newValue) => {
  const ingredients = newValue.split(',').map(i => i.trim()).filter(i => i)
  if (ingredients.some(ing => ing.length < 2)) {
    ingredientError.value = 'Ingredients must be at least 2 characters long.'
  } else {
    ingredientError.value = ''
  }
})

const moodRecommendations = computed(() => {
  if (!selectedMood.value) return []
  const searchIngredientsFromText = ingredientText.value.toLowerCase().split(',').map(i => i.trim()).filter(i => i)
  const allSearchKeywords = [...activeIngredientKeywords.value.map(k => k.toLowerCase()), ...searchIngredientsFromText]
  return mockRecipes.value.filter(recipe => {
    const moodMatch = recipe.mood === selectedMood.value
    if (!moodMatch) return false
    const matchesPreferences = 
      (!preferences.value.isVegetarian || recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan') &&
      (!preferences.value.isVegan || recipe.diet === 'Vegan') &&
      (!preferences.value.isGlutenFree || recipe.diet === 'Gluten-Free') &&
      (!preferences.value.hasNutAllergy || !recipe.ingredients.some(ing => ing.toLowerCase().includes('nut')))
    if (!matchesPreferences) return false
    if (allSearchKeywords.length === 0) return true
    return allSearchKeywords.every(searchIng => recipe.ingredients?.some(recipeIng => recipeIng.toLowerCase().includes(searchIng)))
  })
})

const moods = [
  { name: "Happy", icon: Smile, color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  { name: "Tired", icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { name: "Stressed", icon: Soup, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  { name: "Energized", icon: Pizza, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
]

// --- Recipes Data ---
const searchTerm = ref('')
const debouncedSearchTerm = ref('')
watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue
}, 300))
const dietFilter = ref('All')
const recipePageActiveKeywords = ref<string[]>([])
const mealTypeFilter = ref('All')

const toggleRecipePageIngredient = (keyword: string) => {
  const index = recipePageActiveKeywords.value.indexOf(keyword)
  if (index === -1) {
    recipePageActiveKeywords.value.push(keyword)
  } else {
    recipePageActiveKeywords.value.splice(index, 1)
  }
}

const filteredRecipes = computed(() => {
  const activeKeywords = recipePageActiveKeywords.value.map(k => k.toLowerCase())
  return mockRecipes.value.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase()) || 
                         recipe.description.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase())
    const matchesDiet = dietFilter.value === 'All' || recipe.diet === dietFilter.value
    const matchesMealType = mealTypeFilter.value === 'All' || recipe.mealType === mealTypeFilter.value
    const matchesPreferences = 
      (!preferences.value.isVegetarian || recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan') &&
      (!preferences.value.isVegan || recipe.diet === 'Vegan') &&
      (!preferences.value.isGlutenFree || recipe.diet === 'Gluten-Free') &&
      (!preferences.value.hasNutAllergy || !recipe.ingredients.some(ing => ing.toLowerCase().includes('nut')))
    
    if (!matchesSearch || !matchesDiet || !matchesMealType || !matchesPreferences) return false
    if (activeKeywords.length === 0) return true
    return activeKeywords.every(searchIng => recipe.ingredients?.some(recipeIng => recipeIng.toLowerCase().includes(searchIng)))
  })
})

// --- Profile Data ---
const preferences = ref({
  isVegetarian: localStorage.getItem('isVegetarian') === 'true',
  isVegan: localStorage.getItem('isVegan') === 'true',
  hasNutAllergy: localStorage.getItem('hasNutAllergy') === 'true',
  isGlutenFree: localStorage.getItem('isGlutenFree') === 'true',
})

watch(preferences, (newPrefs) => {
  localStorage.setItem('isVegetarian', newPrefs.isVegetarian.toString())
  localStorage.setItem('isVegan', newPrefs.isVegan.toString())
  localStorage.setItem('hasNutAllergy', newPrefs.hasNutAllergy.toString())
  localStorage.setItem('isGlutenFree', newPrefs.isGlutenFree.toString())
}, { deep: true })
</script>

<template>
  <!-- added register login page -->
  <div v-if="!isAuthenticated" class="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
    <!-- Login Page -->
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
            <Input id="email" type="email" placeholder="m@example.com" />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" />
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
            <svg role="img" viewBox="0 0 24 24" class="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.32 0 2.42.45 3.31 1.22l2.3-2.3c-1.43-1.39-3.26-2.2-5.61-2.2-4.61 0-8.41 3.55-8.41 7.91s3.8 7.91 8.41 7.91c2.44 0 4.28-.83 5.77-2.32 1.54-1.54 2.11-3.75 2.11-5.92 0-.52-.05-1.04-.12-1.54h-9.4v.01z"></path></svg>
            Sign Up with Google
          </Button>
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t" /></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" placeholder="Alex Doe" />
          </div>
          <div class="space-y-2">
            <Label for="email-signup">Email</Label>
            <Input id="email-signup" type="email" placeholder="m@example.com" />
          </div>
          <div class="space-y-2">
            <Label for="password-signup">Password</Label>
            <Input id="password-signup" type="password" />
          </div>
          <div class="space-y-2">
            <Label for="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <div class="items-top flex space-x-2">
            <Label for="terms" class="text-sm font-medium leading-none flex gap-2 items-center">
              <Checkbox id="terms" />
              I agree to the Terms and Conditions
            </label>
          </div>
          <Button @click="handleSignUp" class="w-full">Create Account</Button>
          <p class="text-center text-sm text-muted-foreground">
            Already have an account? 
            <Button variant="link" class="p-0 h-auto" @click="authPage = 'login'">Sign In</Button>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>

  <div v-else class="min-h-screen w-full bg-background text-foreground flex">
    <!-- Sidebar for desktop -->
    <aside class="hidden md:flex flex-col w-64 bg-card border-r p-4 space-y-2">
      <div class="flex items-center space-x-2 px-4 pb-4">
        <UtensilsCrossed class="h-8 w-8" />
        <h1 class="text-2xl font-bold">MealMood</h1>
      </div>
      <Button :variant="currentPage === 'dashboard' ? 'secondary' : 'ghost'" @click="currentPage = 'dashboard'" class="w-full justify-start text-base px-4 py-3">
        <Home class="mr-3 h-5 w-5" /> Dashboard
      </Button>
      <Button :variant="currentPage === 'moodtracker' ? 'secondary' : 'ghost'" @click="currentPage = 'moodtracker'" class="w-full justify-start text-base px-4 py-3">
        <Smile class="mr-3 h-5 w-5" /> Mood Tracker
      </Button>
      <Button :variant="currentPage === 'recipes' ? 'secondary' : 'ghost'" @click="currentPage = 'recipes'" class="w-full justify-start text-base px-4 py-3">
        <Soup class="mr-3 h-5 w-5" /> Recipes
      </Button>
      <Button :variant="currentPage === 'profile' ? 'secondary' : 'ghost'" @click="currentPage = 'profile'" class="w-full justify-start text-base px-4 py-3">
        <User class="mr-3 h-5 w-5" /> Profile
      </Button>
    </aside>


    <main class="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-8" style="z-index: 1;">
      <Dialog :open="!!selectedRecipe" @update:open="selectedRecipe = null" aria-label="Recipe details">
        <div v-if="currentPage === 'dashboard'" class="space-y-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Good Morning, Alex!</h2>
            <p class="text-muted-foreground mt-1">Ready to find your perfect meal?</p>
          </div>
          
          <Card class="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle class="text-emerald-900 dark:text-emerald-200">How are you feeling?</CardTitle>
                <CardDescription class="text-emerald-700 dark:text-emerald-400">Get meal recommendations based on your current mood.</CardDescription>
              </div>
              <Button @click="currentPage = 'moodtracker'" class="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 px-6 py-2 w-full sm:w-auto">Find a Meal</Button>
            </CardHeader>
          </Card>

          <div>
            <h3 class="text-2xl font-bold tracking-tight mb-4">Quick Picks</h3>
            <div class="flex items-center border-b mb-4">
              <Button :variant="dashboardMealType === 'Breakfast' ? 'ghost' : 'ghost'" @click="dashboardMealType = 'Breakfast'" :class="{'border-b-2 border-primary text-primary': dashboardMealType === 'Breakfast'}" class="rounded-none text-muted-foreground">Breakfast</Button>
              <Button :variant="dashboardMealType === 'Lunch' ? 'ghost' : 'ghost'" @click="dashboardMealType = 'Lunch'" :class="{'border-b-2 border-primary text-primary': dashboardMealType === 'Lunch'}" class="rounded-none text-muted-foreground">Lunch</Button>
              <Button :variant="dashboardMealType === 'Dinner' ? 'ghost' : 'ghost'" @click="dashboardMealType = 'Dinner'" :class="{'border-b-2 border-primary text-primary': dashboardMealType === 'Dinner'}" class="rounded-none text-muted-foreground">Dinner</Button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card v-for="recipe in quickPicks" :key="recipe.id" class="flex items-center gap-4 p-4">
                <img :src="recipe.image" :alt="recipe.title" class="w-24 h-24 rounded-lg object-cover" />
                <div class="flex-1">
                  <p class="font-semibold">{{ recipe.title }}</p>
                  <p class="text-sm text-muted-foreground">{{ recipe.description }}</p>
                  <DialogTrigger as-child>
                    <Button variant="link" class="p-0 h-auto mt-2" @click="viewRecipe(recipe)">View Recipe</Button>
                  </DialogTrigger>
                </div>
              </Card>
            </div>
          </div>

          <div class="space-y-18">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 class="text-2xl font-bold tracking-tight mb-4">Last Picked Recipe</h3>
                <Card class="flex flex-col md:flex-row items-center gap-6 p-4 h-full">
                  <img :src="lastPickedRecipe.image" :alt="lastPickedRecipe.title" class="w-full md:w-40 h-40 rounded-lg object-cover" />
                  <div class="flex-1">
                    <p class="text-sm font-medium text-primary">{{ lastPickedRecipe.mealType }}</p>
                    <p class="text-xl font-bold">{{ lastPickedRecipe.title }}</p>
                    <p class="text-muted-foreground mt-2">{{ lastPickedRecipe.description }}</p>
                    <DialogTrigger as-child>
                      <Button class="mt-4" @click="viewRecipe(lastPickedRecipe)">View Recipe Again</Button>
                    </DialogTrigger>
                  </div>
                </Card>
              </div>
              <div>
                <h3 class="text-2xl font-bold tracking-tight mb-4">Your Favorite Recipes</h3>
                <Card class="h-full">
                  <CardContent class="p-4 space-y-4 h-full" :style="{ maxHeight: favoriteRecipes.length > 5 ? '300px' : 'auto', overflowY: favoriteRecipes.length > 5 ? 'auto' : 'visible' }">
                    <div v-for="recipe in favoriteRecipes" :key="recipe.id" class="flex items-center gap-4">
                      <img :src="recipe.image" :alt="recipe.title" class="w-16 h-16 rounded-lg object-cover" />
                      <div class="flex-1">
                        <p class="font-semibold">{{ recipe.title }}</p>
                        <p class="text-sm text-muted-foreground">{{ recipe.mealType }}</p>
                      </div>
                      <DialogTrigger as-child>
                        <Button variant="secondary" @click="viewRecipe(recipe)">View</Button>
                      </DialogTrigger>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div class="mt-8">
              <h3 class="text-2xl font-bold tracking-tight mb-4">Trending This Week</h3>
              <div class="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
                <Card v-for="recipe in trendingRecipes" :key="recipe.id" class="min-w-[280px] flex-shrink-0">
                  <img :src="recipe.image" :alt="recipe.title" class="w-full h-32 object-cover rounded-t-lg" />
                  <CardHeader>
                    <CardTitle class="text-base">{{ recipe.title }}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DialogTrigger as-child>
                      <Button variant="outline" class="w-full" @click="viewRecipe(recipe)">View Recipe</Button>
                    </DialogTrigger>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentPage === 'moodtracker'" class="space-y-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">What's your mood right now?</h2>
            <p class="text-muted-foreground mt-1">Select a mood to get personalized meal suggestions.</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              v-for="mood in moods" 
              :key="mood.name" 
              @click="handleMoodSelect(mood.name)" 
              :class="[mood.color, selectedMood === mood.name ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : 'hover:scale-105']"
              class="p-6 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-200"
              :aria-label="`Select ${mood.name} mood`"
              :aria-pressed="selectedMood === mood.name"
            >
              <component :is="mood.icon" class="h-8 w-8" />
              <span class="font-semibold">{{ mood.name }}</span>
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Have ingredients on hand?</CardTitle>
              <CardDescription>Enter what you have, or select from the keywords below.</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <Textarea v-model="ingredientText" placeholder="e.g., chicken, broccoli, rice..." class="flex-grow" />
              <p v-if="ingredientError" class="text-red-500 text-sm">{{ ingredientError }}</p>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="keyword in ingredientKeywords" 
                  :key="keyword" 
                  :variant="activeIngredientKeywords.includes(keyword) ? 'secondary' : 'outline'" 
                  @click="toggleIngredient(keyword)"
                >
                  {{ keyword }}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div v-if="selectedMood">
            <h3 class="text-2xl font-bold tracking-tight mb-4">AI Recommendations for a <span class="text-emerald-500">{{ selectedMood }}</span> Mood</h3>
            <div v-if="moodRecommendations.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card v-for="recipe in moodRecommendations" :key="recipe.id" class="overflow-hidden flex flex-col">
                <img :src="recipe.image" :alt="recipe.title" class="w-full h-40 object-cover" />
                <CardHeader>
                  <CardTitle>{{ recipe.title }}</CardTitle>
                  <CardDescription class="mt-1">{{ recipe.description }}</CardDescription>
                </CardHeader>
                <CardContent class="flex-grow flex flex-col justify-end">
                  <div class="flex items-center justify-between text-sm text-muted-foreground">
                    <div class="flex items-center gap-1"><Clock class="h-4 w-4" /><span>{{ recipe.time }} min</span></div>
                    <div class="flex items-center gap-1"><Leaf class="h-4 w-4" /><span>{{ recipe.diet }}</span></div>
                  </div>
                  <DialogTrigger as-child>
                    <Button class="w-full mt-4 py-2" @click="viewRecipe(recipe)">View Recipe</Button>
                  </DialogTrigger>
                </CardContent>
              </Card>
            </div>
            <p v-else class="text-muted-foreground text-center py-8">No matching recommendations for this mood and ingredients. Try another combination!</p>
          </div>
        </div>

        <div v-if="currentPage === 'recipes'" class="space-y-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Explore Recipes</h2>
            <p class="text-muted-foreground mt-1">Find your next favorite meal from our collection.</p>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="relative md:col-span-2">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input v-model="searchTerm" placeholder="Search for a recipe..." class="pl-10" />
              </div>
              <Select v-model="mealTypeFilter">
                <SelectTrigger> <SelectValue placeholder="Select a meal type" /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Meal Types</SelectItem>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button 
                v-for="keyword in ingredientKeywords" 
                :key="keyword" 
                :variant="recipePageActiveKeywords.includes(keyword) ? 'secondary' : 'outline'" 
                @click="toggleRecipePageIngredient(keyword)"
              >
                {{ keyword }}
              </Button>
            </div>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="recipe in filteredRecipes" :key="recipe.id" class="overflow-hidden flex flex-col">
              <img :src="recipe.image" :alt="recipe.title" class="w-full h-40 object-cover" />
              <CardHeader>
                <CardTitle>{{ recipe.title }}</CardTitle>
                <CardDescription class="mt-1">{{ recipe.description }}</CardDescription>
              </CardHeader>
              <CardContent class="flex-grow flex flex-col justify-end">
                <div class="flex items-center justify-between text-sm text-muted-foreground">
                  <div class="flex items-center gap-1"><Clock class="h-4 w-4" /><span>{{ recipe.time }} min</span></div>
                  <div class="flex items-center gap-1"><Leaf class="h-4 w-4" /><span>{{ recipe.diet }}</span></div>
                </div>
                <DialogTrigger as-child>
                  <Button class="w-full mt-4 py-2" @click="viewRecipe(recipe)">View Recipe</Button>
                </DialogTrigger>
              </CardContent>
            </Card>
          </div>
        </div>

        <div v-if="currentPage === 'profile'" class="space-y-8 max-w-2xl mx-auto">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Your Profile & Preferences</h2>
            <p class="text-muted-foreground mt-1">Manage your account and dietary needs.</p>
          </div>
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="name">Name</Label>
                <Input id="name" value="Alex Doe" />
              </div>
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" type="email" value="alex.doe@example.com" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>Help us tailor recommendations for you.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Leaf class="h-4 w-4" /> Vegetarian</Label>
                <Switch v-model:checked="preferences.isVegetarian" />
              </div>
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Salad class="h-4 w-4" /> Vegan</Label>
                <Switch v-model:checked="preferences.isVegan" />
              </div>
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><WheatOff class="h-4 w-4" /> Gluten-Free</Label>
                <Switch v-model:checked="preferences.isGlutenFree" />
              </div>
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Sun class="h-4 w-4 dark:hidden" /><Moon class="h-4 w-4 hidden dark:block" /> Dark Mode</Label>
                <Switch v-model:checked="isDarkMode" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Let us know about any allergies to keep you safe.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Drumstick class="h-4 w-4" /> Nut Allergy</Label>
                <Switch v-model:checked="preferences.hasNutAllergy" />
              </div>
            </CardContent>
          </Card>
          <div class="flex justify-end">
            <Button class="px-8 py-2">Save Changes</Button>
          </div>
        </div>

        <DialogContent v-if="selectedRecipe" class="sm:max-w-[625px] grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]" aria-label="Recipe details">
          <img :src="selectedRecipe.image" :alt="selectedRecipe.title" class="w-full h-60 object-cover rounded-t-lg">
          <DialogHeader class="p-6">
            <DialogTitle class="text-2xl font-bold">{{ selectedRecipe.title }}</DialogTitle>
            <DialogDescription class="text-md">{{ selectedRecipe.description }}</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 px-6 pb-6 overflow-y-auto">
            <div class="flex items-center justify-around bg-muted p-3 rounded-lg text-sm">
              <div class="flex items-center gap-2"><Clock class="h-5 w-5 text-muted-foreground" /> <span>{{ selectedRecipe.time }} min</span></div>
              <div class="flex items-center gap-2"><Leaf class="h-5 w-5 text-muted-foreground" /> <span>{{ selectedRecipe.diet }}</span></div>
              <div class="flex items-center gap-2"><Smile class="h-5 w-5 text-muted-foreground" /> <span>{{ selectedRecipe.mood }} Mood</span></div>
            </div>
            <div>
              <h3 class="font-semibold text-lg mb-2">Ingredients</h3>
              <ul class="list-disc list-inside space-y-1 text-muted-foreground">
                <li v-for="ingredient in selectedRecipe.ingredients" :key="ingredient">{{ ingredient }}</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-lg mb-2">Instructions</h3>
              <ol class="list-decimal list-inside space-y-2 text-muted-foreground">
                <li v-for="step in selectedRecipe.instructions" :key="step">{{ step }}</li>
              </ol>
            </div>
          </div>
          <DialogFooter class="p-6 pt-0 sm:justify-between">
            <Button variant="ghost" @click="toggleFavorite(selectedRecipe.id)">
              <Heart class="h-5 w-5 mr-2" :class="{'text-red-500 fill-current': selectedRecipe.favorite}" />
              {{ selectedRecipe.favorite ? 'Favorited' : 'Add to Favorites' }}
            </Button>
            <Button type="button" variant="secondary" @click="selectedRecipe = null">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>

    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2">
      <Button :variant="currentPage === 'dashboard' ? 'secondary' : 'ghost'" @click="currentPage = 'dashboard'" class="flex flex-col items-center h-14 w-16">
        <Home class="h-5 w-5" /><span class="text-xs mt-1">Home</span>
      </Button>
      <Button :variant="currentPage === 'moodtracker' ? 'secondary' : 'ghost'" @click="currentPage = 'moodtracker'" class="flex flex-col items-center h-14 w-16">
        <Smile class="h-5 w-5" /><span class="text-xs mt-1">Mood</span>
      </Button>
      <Button :variant="currentPage === 'recipes' ? 'secondary' : 'ghost'" @click="currentPage = 'recipes'" class="flex flex-col items-center h-14 w-16">
        <Soup class="h-5 w-5" /><span class="text-xs mt-1">Recipes</span>
      </Button>
      <Button :variant="currentPage === 'profile' ? 'secondary' : 'ghost'" @click="currentPage = 'profile'" class="flex flex-col items-center h-14 w-16">
        <User class="h-5 w-5" /><span class="text-xs mt-1">Profile</span>
      </Button>
    </nav>
  </div>
</template>