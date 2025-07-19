<script setup lang="ts">
import { ref, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { Home, UtensilsCrossed, Smile, User, Search, Heart, Soup, Salad, Pizza, Clock, Leaf, WheatOff, Drumstick } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Dialog components from shadcn-vue.
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose} from '@/components/ui/dialog'

// --- State and Data ---
const currentPage = ref('dashboard')

const mockRecipes = ref([
  { id: 1, title: "Hearty Lentil Soup", description: "A warm and comforting soup for a chilly day.", mood: "Stressed", time: 30, diet: "Vegan", image: "https://placehold.co/600x400/f87171/ffffff?text=Lentil+Soup", ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Vegetable Broth", "Vegetables"] },
  { id: 2, title: "Quinoa Salad", description: "A light and refreshing salad to boost your energy.", mood: "Happy", time: 15, diet: "Vegetarian", image: "https://placehold.co/600x400/4ade80/ffffff?text=Quinoa+Salad", ingredients: ["Quinoa", "Cucumber", "Tomatoes", "Feta Cheese", "Lemon Juice", "Vegetables"] },
  // This recipe is now both "Happy" and contains "Chicken"
  { id: 3, title: "Happy Chicken Salad", description: "A joyful and protein-packed salad.", mood: "Happy", time: 20, diet: "High-Protein", image: "https://placehold.co/600x400/fb923c/ffffff?text=Chicken+Salad", ingredients: ["Chicken", "Lettuce", "Tomatoes", "Avocado", "Vegetables"] },
  { id: 4, title: "Avocado Toast with Egg", description: "A simple and satisfying breakfast or lunch.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/34d399/ffffff?text=Avocado+Toast", ingredients: ["Bread", "Avocado", "Egg", "Chili Flakes"] },
  { id: 5, title: "Spicy Black Bean Burgers", description: "Flavor-packed burgers that are surprisingly healthy.", mood: "Energized", time: 40, diet: "Vegan", image: "https://placehold.co/600x400/a78bfa/ffffff?text=Bean+Burger", ingredients: ["Black Beans", "Breadcrumbs", "Onion", "Spices", "Vegetables"] },
  // This recipe is both "Stressed" and contains "Pasta"
  { id: 6, title: "Creamy Tomato Pasta", description: "Classic comfort food for a cozy night in.", mood: "Stressed", time: 25, diet: "Vegetarian", image: "https://placehold.co/600x400/f472b6/ffffff?text=Tomato+Pasta", ingredients: ["Pasta", "Tomatoes", "Garlic", "Cream", "Basil"] },
  // This recipe is both "Tired" and contains "Fish"
  { id: 7, title: "15-Min Lemon Garlic Tilapia", description: "Super fast and light for when you're tired.", mood: "Tired", time: 15, diet: "High-Protein", image: "https://placehold.co/600x400/38bdf8/ffffff?text=Tilapia", ingredients: ["Tilapia", "Fish", "Garlic", "Lemon"] },
]);

// Added state to track the currently selected recipe for the dialog.
type Recipe = typeof mockRecipes.value[0];
const selectedRecipe = ref<Recipe | null>(null);

const viewRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
}

// --- Dashboard Data ---
const chartOptions = ref({
  chart: { toolbar: { show: false }, },
  plotOptions: { bar: { borderRadius: 4, horizontal: false, }, },
  dataLabels: { enabled: false },
  xaxis: { categories: ['Stressed', 'Tired', 'Happy', 'Energized'], labels: { style: { colors: '#888' } } },
  yaxis: { labels: { style: { colors: '#888' } } },
  grid: { borderColor: '#f0f0f0', strokeDashArray: 4, },
  colors: ['#10b981'],
});
const chartSeries = ref([{ name: 'moods', data: [4, 2, 8, 5] }]);

// --- MoodTracker Data ---
const selectedMood = ref<string | null>(null)
const ingredientText = ref('')
const ingredientKeywords = ['Chicken', 'Fish', 'Beef', 'Vegetables', 'Pasta', 'Rice', 'Burger']

// 1. Added a new ref to track which keyword buttons are active.
const activeIngredientKeywords = ref<string[]>([])

// 2. Created a new function to toggle keywords in the active list.
const toggleIngredient = (keyword: string) => {
  const index = activeIngredientKeywords.value.indexOf(keyword);
  if (index === -1) {
    activeIngredientKeywords.value.push(keyword);
  } else {
    activeIngredientKeywords.value.splice(index, 1);
  }
}

// 1. Created a new function to handle mood selection.
const handleMoodSelect = (moodName: string) => {
  selectedMood.value = moodName;
  // 2. This function now resets the ingredient filters for a better user experience.
  activeIngredientKeywords.value = [];
  ingredientText.value = '';
}

// 3. Updated the computed property to filter based on the new active keywords list.
const moodRecommendations = computed(() => {
  if (!selectedMood.value) return []

  const searchIngredientsFromText = ingredientText.value
    .toLowerCase()
    .split(',')
    .map(i => i.trim())
    .filter(i => i);

  const allSearchKeywords = [...activeIngredientKeywords.value.map(k => k.toLowerCase()), ...searchIngredientsFromText];

  return mockRecipes.value.filter(recipe => {
    const moodMatch = recipe.mood === selectedMood.value;
    if (!moodMatch) return false;
    if (allSearchKeywords.length === 0) return true;

    // Logic now checks if a recipe contains ALL of the selected keywords.
    return allSearchKeywords.every(searchIng => 
      recipe.ingredients?.some(recipeIng => 
        recipeIng.toLowerCase().includes(searchIng)
      )
    );
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
const dietFilter = ref('All')

// 1. Added state and a toggle function specifically for the Recipes page filter.
const recipePageActiveKeywords = ref<string[]>([])

const toggleRecipePageIngredient = (keyword: string) => {
  const index = recipePageActiveKeywords.value.indexOf(keyword);
  if (index === -1) {
    recipePageActiveKeywords.value.push(keyword);
  } else {
    recipePageActiveKeywords.value.splice(index, 1);
  }
}

// 2. Updated the filteredRecipes computed property to include the new keyword filter.
const filteredRecipes = computed(() => {
  const activeKeywords = recipePageActiveKeywords.value.map(k => k.toLowerCase());

  return mockRecipes.value.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.value.toLowerCase()) || recipe.description.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesDiet = dietFilter.value === 'All' || recipe.diet === dietFilter.value;
    
    if (!matchesSearch || !matchesDiet) return false;

    if (activeKeywords.length === 0) return true;

    return activeKeywords.every(searchIng => 
      recipe.ingredients?.some(recipeIng => 
        recipeIng.toLowerCase().includes(searchIng)
      )
    );
  });
})

// --- Profile Data ---
const preferences = ref({
  isVegetarian: true,
  isVegan: false,
  hasNutAllergy: false,
  isGlutenFree: true,
});

</script>

<template>
  <div class="min-h-screen w-full bg-background text-foreground flex">
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

    <!-- Main content -->
    <main class="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
      
      <!-- 1. Wrapped all pages inside a single <Dialog> component. -->
      <Dialog :open="!!selectedRecipe" @update:open="selectedRecipe = null">
        <!-- Dashboard Page -->
        <div v-if="currentPage === 'dashboard'" class="space-y-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Good Morning, Alex!</h2>
            <p class="text-muted-foreground mt-1">What culinary adventure awaits you today?</p>
          </div>
          <Card class="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader class="flex flex-row items-center justify-between">
              <div>
                <CardTitle class="text-emerald-900 dark:text-emerald-200">How are you feeling?</CardTitle>
                <CardDescription class="text-emerald-700 dark:text-emerald-400">Get meal recommendations based on your current mood.</CardDescription>
              </div>
              <Button @click="currentPage = 'moodtracker'" class="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 px-6 py-2">Find a Meal</Button>
            </CardHeader>
          </Card>
          <div class="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Mood Summary</CardTitle>
                <CardDescription>Here's a look at your mood trends this week.</CardDescription>
              </CardHeader>
              <CardContent>
                <VueApexCharts type="bar" height="250" :options="chartOptions" :series="chartSeries" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Your Favorite Recipes</CardTitle>
                <CardDescription>Your go-to meals that you've saved.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div v-for="recipe in [mockRecipes[0], mockRecipes[5]]" :key="recipe.id" class="flex items-center space-x-4">
                  <img :src="recipe.image" :alt="recipe.title" class="w-16 h-16 rounded-lg object-cover" />
                  <div class="flex-1">
                    <p class="font-semibold">{{ recipe.title }}</p>
                    <p class="text-sm text-muted-foreground">{{ recipe.mood }} • {{ recipe.time }} min</p>
                  </div>
                  <Button variant="ghost"><Heart class="h-5 w-5 text-red-500 fill-current" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- MoodTracker Page -->
        <div v-if="currentPage === 'moodtracker'" class="space-y-8">
           <div>
              <h2 class="text-3xl font-bold tracking-tight">What's your mood right now?</h2>
              <p class="text-muted-foreground mt-1">Select a mood to get personalized meal suggestions.</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button v-for="mood in moods" :key="mood.name" @click="handleMoodSelect(mood.name)" :class="[mood.color, selectedMood === mood.name ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : 'hover:scale-105']" class="p-6 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-200">
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
                  <div class="flex flex-wrap gap-2">
                    <Button 
                      v-for="keyword in ingredientKeywords" 
                      :key="keyword" 
                      :variant="activeIngredientKeywords.includes(keyword) ? 'secondary' : 'outline'" 
                      @click="toggleIngredient(keyword)">
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

        <!-- Recipes Page -->
        <div v-if="currentPage === 'recipes'" class="space-y-8">
          <div>
              <h2 class="text-3xl font-bold tracking-tight">Explore Recipes</h2>
              <p class="text-muted-foreground mt-1">Find your next favorite meal from our collection.</p>
          </div>
          <div class="space-y-4">
              <div class="flex flex-col md:flex-row gap-4">
                  <div class="relative flex-grow">
                      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input v-model="searchTerm" placeholder="Search for a recipe..." class="pl-10" />
                  </div>
                  <Select v-model="dietFilter">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a diet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                      <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="High-Protein">High-Protein</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button 
                  v-for="keyword in ingredientKeywords" 
                  :key="keyword" 
                  :variant="recipePageActiveKeywords.includes(keyword) ? 'secondary' : 'outline'" 
                  @click="toggleRecipePageIngredient(keyword)">
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

        <!-- Profile Page -->
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

        <!-- The Dialog's content is now outside the v-if blocks, but the parent <Dialog> wraps them. -->
        <DialogContent v-if="selectedRecipe" class="sm:max-w-[625px] grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]">
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
          <DialogFooter class="p-6 pt-0">
            <Button type="button" variant="secondary" @click="selectedRecipe = null">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>

    <!-- Bottom navigation for mobile -->
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

    <!-- 4. Added the Dialog component to the main template. It will only show when a recipe is selected. -->
    <Dialog :open="!!selectedRecipe" @update:open="selectedRecipe = null">
      <DialogContent v-if="selectedRecipe" class="sm:max-w-[625px] grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]">
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
        <DialogFooter class="p-6 pt-0">
          <Button type="button" variant="secondary" @click="selectedRecipe = null">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
