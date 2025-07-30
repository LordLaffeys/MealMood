<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import Chart from 'primevue/chart';
import type { Recipe } from '@/types/recipe';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Leaf, TrendingUp, Heart } from 'lucide-vue-next';

const props = defineProps<{
  recipes: Recipe[];
  isDarkMode: boolean;
  preferences?: any;
}>();

const emit = defineEmits(['view-recipe', 'navigate']);

const user = useCurrentUser();
const db = getFirestore();

const dashboardMealType = ref('Breakfast');

// Get trending recipes (you can implement your own trending logic)
const trendingRecipes = computed(() => {
  if (!props.recipes) return [];
  // For now, we'll consider recipes with specific moods as trending
  // You can implement your own trending algorithm
  return props.recipes
    .filter(r => ['Happy', 'Stressed'].includes(r.mood))
    .slice(0, 6);
});

// Get user's last picked recipes from their profile data
const lastPickedRecipes = computed(() => {
  if (!props.recipes || !props.preferences?.lastPickedRecipes) return [];
  
  // Get the last picked recipe IDs and find the corresponding recipes
  const lastPickedIds = props.preferences.lastPickedRecipes.slice(-2);
  return lastPickedIds
    .map((id: number) => props.recipes.find(recipe => recipe.id === id))
    .filter(Boolean)
    .reverse(); // Show most recent first
});

// Get daily quick picks based on the current date (changes daily)
const quickPicks = computed(() => {
  if (!props.recipes) return [];
  
  // Create a seed based on current date and meal type for consistent daily rotation
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const seed = dayOfYear + dashboardMealType.value.charCodeAt(0);
  
  // Filter recipes by meal type
  const mealTypeRecipes = props.recipes.filter(r => r.mealType === dashboardMealType.value);
  
  if (!mealTypeRecipes.length) return [];
  
  // Shuffle recipes based on the daily seed
  const shuffled = [...mealTypeRecipes].sort((a, b) => {
    const aHash = (a.id * seed) % 1000;
    const bHash = (b.id * seed) % 1000;
    return aHash - bHash;
  });
  
  return shuffled.slice(0, 5);
});

// Get user's favorite recipes
const favoriteRecipes = computed(() => {
  if (!props.recipes) return [];
  return props.recipes.filter(r => r.favorite);
});

// Helper function to get primary diet for display
const getPrimaryDiet = (dietArray: string[]) => {
  if (!dietArray || dietArray.length === 0) return 'General';
  return dietArray[0];
};

// Function to track when a recipe is viewed (add to last picked)
const handleViewRecipe = async (recipe: Recipe) => {
  emit('view-recipe', recipe);
  
  // Update user's last picked recipes in Firestore
  if (user.value) {
    try {
      const userDocRef = doc(db, 'users', user.value.uid);
      await updateDoc(userDocRef, {
        lastPickedRecipes: arrayUnion(recipe.id)
      });
    } catch (error) {
      console.error('Error updating last picked recipes:', error);
    }
  }
};

// Chart data and options
const weeklyChartData = ref();
const weeklyChartOptions = ref();

// Generate mock mood data based on user's recipe preferences
const generateMoodData = () => {
  const moods = ['Happy', 'Sad', 'Angry', 'Tired', 'Stressed', 'Bored'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create datasets based on actual recipe moods in the database
  const datasets = moods.map(mood => {
    const moodCount = props.recipes?.filter(r => r.mood === mood).length || 0;
    const colors = {
      'Happy': '#22c55e',
      'Sad': '#3b82f6', 
      'Angry': '#ef4444',
      'Tired': '#64748b',
      'Stressed': '#8b5cf6',
      'Bored': '#f59e0b'
    };
    
    // Generate some variation based on mood popularity
    const baseValue = Math.max(1, Math.floor(moodCount / 3));
    const data = days.map(() => Math.max(0, baseValue + Math.floor(Math.random() * 3) - 1));
    
    return {
      type: 'bar',
      label: mood,
      backgroundColor: colors[mood as keyof typeof colors],
      data,
      stack: 'moods',
      order: 2
    };
  });
  
  // Add health score line
  datasets.push({
    type: 'line',
    label: 'Health Score',
    borderColor: '#4f46e5',
    tension: 0.4,
    data: [75, 80, 65, 85, 70, 88, 82],
    yAxisID: 'y1',
    order: 1
  } as any);
  
  return datasets;
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = props.isDarkMode ? '#ffffff' : '#000000';
  const textColorSecondary = props.isDarkMode ? '#a1a1aa' : '#64748b';
  
  weeklyChartData.value = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: generateMoodData()
  };
  
  weeklyChartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textColorSecondary },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: { color: textColorSecondary, stepSize: 2 },
        grid: { display: false },
        title: { display: true, text: 'Mood Frequency', color: textColorSecondary },
        max: 12
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { color: textColorSecondary },
        grid: { display: false },
        title: { display: true, text: 'Health Score (AI)', color: textColorSecondary },
        min: 0,
        max: 100
      }
    }
  };
};

// Get user's name from preferences or default
const userName = computed(() => {
  return props.preferences?.name || 'Friend';
});

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Get total recipe stats
const recipeStats = computed(() => {
  if (!props.recipes) return { total: 0, favorites: 0, recent: 0 };
  
  return {
    total: props.recipes.length,
    favorites: props.recipes.filter(r => r.favorite).length,
    recent: lastPickedRecipes.value.length
  };
});

onMounted(setChartOptions);
watch(() => props.isDarkMode, setChartOptions);
watch(() => props.recipes, setChartOptions);
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{{ getGreeting() }}, {{ userName }}!</h2>
        <p class="text-muted-foreground mt-1">Ready to find your perfect meal?</p>
      </div>
      <div class="hidden md:flex gap-4 text-sm text-muted-foreground">
        <div class="text-center">
          <div class="font-semibold text-foreground">{{ recipeStats.total }}</div>
          <div>Total Recipes</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-foreground">{{ recipeStats.favorites }}</div>
          <div>Favorites</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-foreground">{{ recipeStats.recent }}</div>
          <div>Recent</div>
        </div>
      </div>
    </div>

    <!-- Mood Tracker CTA -->
    <Card class="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
      <CardHeader class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle class="text-emerald-900 dark:text-emerald-200">How are you feeling?</CardTitle>
          <CardDescription class="text-emerald-700 dark:text-emerald-400">
            Get personalized meal recommendations based on your current mood and preferences.
          </CardDescription>
        </div>
        <Button 
          @click="emit('navigate', 'moodtracker')" 
          class="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 px-6 py-2 w-full sm:w-auto"
        >
          Find a Meal
        </Button>
      </CardHeader>
    </Card>

    <!-- Weekly Summary Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Weekly Summary</CardTitle>
        <CardDescription>Your mood patterns and health score trends for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <Chart type="bar" :data="weeklyChartData" :options="weeklyChartOptions" class="h-[350px]" />
      </CardContent>
    </Card>

    <!-- Quick Picks Section -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-2xl font-bold tracking-tight">Daily Quick Picks</h3>
        <p class="text-sm text-muted-foreground">Refreshes daily</p>
      </div>
      
      <!-- Meal Type Tabs -->
      <div class="flex items-center border-b mb-4">
        <Button 
          v-for="mealType in ['Breakfast', 'Lunch', 'Dinner']"
          :key="mealType"
          variant="ghost" 
          @click="dashboardMealType = mealType" 
          :class="{'border-b-2 border-primary text-primary': dashboardMealType === mealType}" 
          class="rounded-none text-muted-foreground"
        >
          {{ mealType }}
        </Button>
      </div>

      <!-- Quick Picks Grid -->
      <div v-if="quickPicks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card v-for="recipe in quickPicks" :key="recipe.id" class="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
          <div class="relative">
            <img :src="recipe.image" :alt="recipe.title" class="w-20 h-20 rounded-lg object-cover" />
            <div v-if="recipe.favorite" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
              <Heart class="h-3 w-3 fill-current" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">{{ recipe.title }}</p>
            <p class="text-xs text-muted-foreground line-clamp-2">{{ recipe.description }}</p>
            <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock class="h-3 w-3" />
              <span>{{ recipe.time }}m</span>
              <Leaf class="h-3 w-3" />
              <span>{{ getPrimaryDiet(recipe.diet) }}</span>
            </div>
            <Button variant="link" class="p-0 h-auto text-xs mt-1" @click="handleViewRecipe(recipe)">
              View Recipe
            </Button>
          </div>
        </Card>
      </div>
      
      <Card v-else class="p-8 text-center">
        <p class="text-muted-foreground">No {{ dashboardMealType.toLowerCase() }} recipes available.</p>
      </Card>
    </div>

    <!-- Last Picked & Favorites Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Last Picked Recipes -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold tracking-tight">Recently Viewed</h3>
        
        <div v-if="lastPickedRecipes.length > 0" class="space-y-4">
          <Card v-for="recipe in lastPickedRecipes" :key="recipe.id" class="p-6">
            <div class="flex flex-col md:flex-row items-start gap-4">
              <img :src="recipe.image" :alt="recipe.title" class="w-full md:w-32 h-32 rounded-lg object-cover" />
              <div class="flex-1">
                <p class="text-sm font-medium text-primary mb-1">{{ recipe.mealType }}</p>
                <h4 class="text-lg font-bold mb-2">{{ recipe.title }}</h4>
                <p class="text-muted-foreground text-sm mb-3 line-clamp-2">{{ recipe.description }}</p>
                <div class="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div class="flex items-center gap-1">
                    <Clock class="h-4 w-4" />
                    <span>{{ recipe.time }} min</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Leaf class="h-4 w-4" />
                    <span>{{ getPrimaryDiet(recipe.diet) }}</span>
                  </div>
                </div>
                <Button size="sm" @click="handleViewRecipe(recipe)">View Recipe Again</Button>
              </div>
            </div>
          </Card>
        </div>
        
        <Card v-else class="p-8 text-center">
          <p class="text-muted-foreground">No recent recipes yet. Start exploring!</p>
          <Button variant="outline" class="mt-2" @click="emit('navigate', 'recipes')">
            Browse Recipes
          </Button>
        </Card>
      </div>

      <!-- Favorite Recipes -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold tracking-tight">Your Favorites</h3>
        
        <Card class="h-[400px]">
          <CardContent class="p-0 h-full">
            <div v-if="favoriteRecipes.length > 0" class="h-full overflow-y-auto">
              <div class="space-y-3 p-4">
                <div v-for="recipe in favoriteRecipes" :key="recipe.id" class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <img :src="recipe.image" :alt="recipe.title" class="w-12 h-12 rounded-lg object-cover" />
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate">{{ recipe.title }}</p>
                    <p class="text-xs text-muted-foreground">{{ recipe.mealType }}</p>
                  </div>
                  <Button variant="secondary" size="sm" @click="handleViewRecipe(recipe)">
                    View
                  </Button>
                </div>
              </div>
            </div>
            
            <div v-else class="h-full flex items-center justify-center text-center p-6">
              <div>
                <Heart class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p class="text-muted-foreground">You haven't favorited any recipes yet.</p>
                <Button variant="outline" class="mt-2" @click="emit('navigate', 'recipes')">
                  Discover Recipes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Trending Section -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <TrendingUp class="h-6 w-6" />
        <h3 class="text-2xl font-bold tracking-tight">Trending This Week</h3>
      </div>
      
      <div v-if="trendingRecipes.length > 0" class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        <Card v-for="recipe in trendingRecipes" :key="recipe.id" class="min-w-[280px] flex-shrink-0 hover:shadow-lg transition-shadow">
          <div class="relative">
            <img :src="recipe.image" :alt="recipe.title" class="w-full h-32 object-cover rounded-t-lg" />
            <div class="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              Trending
            </div>
            <div v-if="recipe.favorite" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
              <Heart class="h-4 w-4 fill-current" />
            </div>
          </div>
          <CardHeader>
            <CardTitle class="text-base line-clamp-2">{{ recipe.title }}</CardTitle>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock class="h-4 w-4" />
              <span>{{ recipe.time }}m</span>
              <Leaf class="h-4 w-4" />
              <span>{{ getPrimaryDiet(recipe.diet) }}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" class="w-full" @click="handleViewRecipe(recipe)">
              View Recipe
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card v-else class="p-8 text-center">
        <TrendingUp class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p class="text-muted-foreground">No trending recipes at the moment.</p>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>