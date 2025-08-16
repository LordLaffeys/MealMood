<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { getFirestore, doc, updateDoc, arrayUnion, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { FirebaseError } from "firebase/app";
import Chart from 'primevue/chart';
import type { Recipe } from '@/types/recipe';
import type { MoodLog, WeeklyMoodSummary, MoodType } from '@/types/mood';
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

// Mood logs data
const moodLogsData = ref<MoodLog[]>([]);
const isLoadingMoodLogs = ref(true);

// Function to fetch mood logs for the current user
const fetchMoodLogs = async () => {
  if (!user.value) {
    console.log('No user found, skipping mood logs fetch');
    isLoadingMoodLogs.value = false;
    return;
  }

  try {
    isLoadingMoodLogs.value = true;
    console.log('Fetching mood logs for user:', user.value.uid);
    
    // Get the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    console.log('Date range - From:', sevenDaysAgo, 'To:', new Date());

    const moodLogsRef = collection(db, 'moodLogs');
    
    // First, let's try without date filter to see if there's any data
    console.log('Trying to fetch all mood logs for user first...');
    const simpleQuery = query(
      moodLogsRef,
      where('userId', '==', user.value.uid)
    );
    
    const simpleSnapshot = await getDocs(simpleQuery);
    console.log('Total mood logs for user:', simpleSnapshot.size);
    
    if (simpleSnapshot.size === 0) {
      console.log('No mood logs found for this user');
      moodLogsData.value = [];
      return;
    }

    // If we have data, let's check what's in it
    simpleSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Sample mood log:', {
        id: doc.id,
        mood: data.mood,
        timestamp: data.timestamp,
        userId: data.userId,
        recipeId: data.recipeId
      });
    });

    // Now try with the date filter
    const q = query(
      moodLogsRef,
      where('userId', '==', user.value.uid),
      where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('timestamp', 'desc')
    );

    console.log('Fetching with date filter...');
    const querySnapshot = await getDocs(q);
    console.log('Filtered mood logs count:', querySnapshot.size);
    
    const logs: MoodLog[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Processing mood log:', data);
      
      // Check if timestamp exists and is valid
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        logs.push({
          id: doc.id,
          mood: data.mood || 'Unknown',
          recipeId: data.recipeId || '',
          timestamp: data.timestamp.toDate(), // Convert Firestore timestamp to JS Date
          userId: data.userId || ''
        });
      } else {
        console.warn('Invalid timestamp found in mood log:', doc.id, data);
      }
    });

    moodLogsData.value = logs;
    console.log('Final processed mood logs:', logs);
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    
    // If there's an error with the complex query, try a simpler one
    try {
      console.log('Trying fallback query without orderBy...');
      const fallbackQuery = query(
        collection(db, 'moodLogs'),
        where('userId', '==', user.value.uid)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackLogs: MoodLog[] = [];
      
      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          fallbackLogs.push({
            id: doc.id,
            mood: data.mood || 'Unknown',
            recipeId: data.recipeId || '',
            timestamp: data.timestamp.toDate(),
            userId: data.userId || ''
          });
        }
      });
      
      // Sort by timestamp manually and filter to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const filteredLogs = fallbackLogs
        .filter(log => log.timestamp >= sevenDaysAgo)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      moodLogsData.value = filteredLogs;
      console.log('Fallback query successful:', filteredLogs);
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      moodLogsData.value = [];
    }
  } finally {
    isLoadingMoodLogs.value = false;
  }
};

// Function to process mood data for the chart
const processWeeklyMoodData = () => {
  if (!moodLogsData.value.length) {
    return {
      labels: [],
      datasets: []
    };
  }

  // Create labels for the last 7 days
  const today = new Date();
  const days = [];
  const dayLabels = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
    dayLabels.push(date.toLocaleDateString('en', { weekday: 'short' }));
  }

  // Group mood logs by day
  const moodsByDay = days.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return moodLogsData.value.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= dayStart && logDate <= dayEnd;
    });
  });

  // Count moods for each day
  const moodTypes: MoodType[] = ['Happy', 'Sad', 'Angry', 'Tired', 'Stressed', 'Bored'];
  const moodCounts = moodTypes.map(mood => {
    return moodsByDay.map(dayMoods => 
      dayMoods.filter(log => log.mood === mood).length
    );
  });

  // Create datasets
  const colors = {
    'Happy': '#22c55e',
    'Sad': '#3b82f6', 
    'Angry': '#ef4444',
    'Tired': '#64748b',
    'Stressed': '#8b5cf6',
    'Bored': '#f59e0b'
  };

  const datasets = moodTypes.map((mood, index) => ({
    type: 'bar',
    label: mood,
    backgroundColor: colors[mood as keyof typeof colors],
    data: moodCounts[index],
    stack: 'moods',
    order: 2
  }));

  // Calculate health score based on mood positivity, balance, and engagement
  const healthScores = moodsByDay.map(dayMoods => {
    if (dayMoods.length === 0) return null; // Neutral score if no data
    
    const totalCount = dayMoods.length;
    const moodCounts = {
      Happy: dayMoods.filter(log => log.mood === 'Happy').length,
      Sad: dayMoods.filter(log => log.mood === 'Sad').length,
      Angry: dayMoods.filter(log => log.mood === 'Angry').length,
      Tired: dayMoods.filter(log => log.mood === 'Tired').length,
      Stressed: dayMoods.filter(log => log.mood === 'Stressed').length,
      Bored: dayMoods.filter(log => log.mood === 'Bored').length,
    };
    
    // 1. Positivity Score (40%) - Weighted by mood positivity
    const moodWeights = {
      Happy: 1.0,      // Very positive
      Bored: 0.6,      // Neutral-negative
      Tired: 0.4,      // Slightly negative
      Stressed: 0.2,   // Negative
      Sad: 0.1,        // Very negative  
      Angry: 0.0       // Most negative
    };
    
    const weightedScore = Object.entries(moodCounts).reduce((sum, [mood, count]) => {
      return sum + (count * moodWeights[mood as keyof typeof moodWeights]);
    }, 0);
    
    const positivityScore = (weightedScore / totalCount) * 40;
    
    // 2. Engagement Score (30%) - Higher when user tracks more moods
    const maxDailyLogs = 10; // Assume 10 is excellent engagement
    const engagementScore = Math.min((totalCount / maxDailyLogs) * 30, 30);
    
    // 3. Balance Score (30%) - Reward emotional awareness (not just happiness)
    const uniqueMoods = new Set(dayMoods.map(log => log.mood)).size;
    const hasPositive = moodCounts.Happy > 0;
    const hasNegativeButManageable = (moodCounts.Stressed + moodCounts.Tired) > 0 && 
                                     (moodCounts.Sad + moodCounts.Angry) <= totalCount * 0.3;
    
    let balanceScore = (uniqueMoods / 6) * 15; // Base diversity score
    
    // Bonus for healthy emotional range
    if (hasPositive && hasNegativeButManageable) {
      balanceScore += 10; // Bonus for acknowledging both positive and manageable negative emotions
    } else if (hasPositive && (moodCounts.Sad + moodCounts.Angry) === 0) {
      balanceScore += 5; // Small bonus for mostly positive day
    }
    
    balanceScore = Math.min(balanceScore, 30);
    
    const finalScore = Math.min(Math.round(positivityScore + engagementScore + balanceScore), 100);
    
    // Debug logging for development
    if (totalCount > 0) {
      console.log(`Health Score Debug for day with ${totalCount} logs:`, {
        moodCounts,
        positivityScore: Math.round(positivityScore),
        engagementScore: Math.round(engagementScore), 
        balanceScore: Math.round(balanceScore),
        finalScore
      });
    }
    
    return finalScore;
  });

  // Add health score line
  datasets.push({
    type: 'line',
    label: 'Health Score',
    borderColor: '#4f46e5',
    backgroundColor: 'transparent',
    tension: 0.4,
    data: healthScores,
    yAxisID: 'y1',
    order: 1,
    borderWidth: 2,
    pointBackgroundColor: '#4f46e5',
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    pointRadius: 4
  } as any);

  return {
    labels: dayLabels,
    datasets
  };
};

// Get trending recipes (you can implement your own trending logic)
const trendingRecipes = computed(() => {
  if (!props.recipes) return [];
  return props.recipes
    .filter(r => r.trendingScore !== undefined) // only recipes with score
    .sort((a, b) => b.trendingScore - a.trendingScore) // highest first
    .slice(0, 6); // take top 6
});

// Get user's last picked recipes from their profile data
const lastViewedRecipes = computed(() => {
  if (!props.recipes || !moodLogsData.value.length) return [];

  // Take last 3 mood logs with recipeId
  const recentLogs = [...moodLogsData.value]
    .filter(log => !!log.recipeId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 3);

  // Map logs to recipes
  return recentLogs
    .map(log => props.recipes.find(r => r.id === log.recipeId))
    .filter(Boolean) as Recipe[];
});

function stringToHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // convert to 32bit int
  }
  return Math.abs(hash);
}

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
  const aHash = (stringToHash(a.id) * seed) % 1000;
  const bHash = (stringToHash(b.id) * seed) % 1000;
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

const setChartOptions = () => {
  const textColor = props.isDarkMode ? '#ffffff' : '#000000';
  const textColorSecondary = props.isDarkMode ? '#a1a1aa' : '#64748b';
  
  weeklyChartData.value = processWeeklyMoodData();
  
  weeklyChartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      legend: {
        position: 'top',
        labels: { 
          color: textColor,
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            if (context.datasetIndex === weeklyChartData.value.datasets.length - 1) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y} times`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textColorSecondary },
        grid: { display: false },
        title: { 
          display: true, 
          text: 'Days of the Week', 
          color: textColorSecondary 
        }
      },
      y: {
        stacked: true,
        ticks: { 
          color: textColorSecondary, 
          stepSize: 1,
          beginAtZero: true
        },
        grid: { 
          display: true, 
          color: props.isDarkMode ? '#374151' : '#e5e7eb'
        },
        title: { 
          display: true, 
          text: 'Mood Count', 
          color: textColorSecondary 
        },
        max: Math.max(10, Math.max(...(weeklyChartData.value?.datasets?.slice(0, -1)?.flatMap((d: any) => d.data) || [0])) + 2)
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: { 
          color: textColorSecondary,
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: { display: false },
        title: { 
          display: true, 
          text: 'Health Score', 
          color: textColorSecondary 
        },
        min: 0,
        max: 100
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
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
    recent: lastViewedRecipes.value.length
  };
});

// Get mood summary for the week
const weeklyMoodSummary = computed<WeeklyMoodSummary | null>(() => {
  if (!moodLogsData.value.length) return null;
  
  const moodCounts = moodLogsData.value.reduce((acc, log) => {
    acc[log.mood] = (acc[log.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalLogs = moodLogsData.value.length;
  const mostCommonMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return {
    totalLogs,
    mostCommonMood: mostCommonMood ? mostCommonMood[0] : null,
    moodCounts
  };
});

// Watch for user changes and refetch data
watch(user, (newUser) => {
  if (newUser) {
    fetchMoodLogs();
  }
}, { immediate: true });

// Watch for data changes and update chart
watch([() => props.isDarkMode, moodLogsData], () => {
  setChartOptions();
}, { deep: true });

onMounted(() => {
  if (user.value) {
    fetchMoodLogs();
  }
  setChartOptions();
});
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
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Weekly Mood Tracking</CardTitle>
            <CardDescription>
              Your mood patterns and wellness score for the last 7 days
              <span v-if="weeklyMoodSummary" class="block mt-1">
                <span class="font-medium">{{ weeklyMoodSummary.totalLogs }}</span> mood entries this week
                <span v-if="weeklyMoodSummary.mostCommonMood" class="text-primary">
                  • Most common: {{ weeklyMoodSummary.mostCommonMood }}
                </span>
              </span>
            </CardDescription>
          </div>
          <div v-if="isLoadingMoodLogs" class="flex items-center gap-2 text-sm text-muted-foreground">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading data...
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="!isLoadingMoodLogs">
          <div v-if="moodLogsData.length > 0">
            <Chart type="bar" :data="weeklyChartData" :options="weeklyChartOptions" class="h-[350px]" />
          </div>
          <div v-else class="h-[350px] flex items-center justify-center text-center">
            <div class="space-y-2">
              <p class="text-muted-foreground">No mood data available yet.</p>
              <p class="text-sm text-muted-foreground">Start tracking your moods by picking recipes!</p>
              <Button variant="outline" @click="emit('navigate', 'moodtracker')">
                Track Your First Mood
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="h-[350px] flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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

        <Card class="h-[400px]">
          <CardContent class="p-0 h-full">
            <div v-if="lastViewedRecipes.length > 0" class="h-full overflow-y-auto">
              <div class="space-y-4 p-4">
                <Card v-for="recipe in lastViewedRecipes" :key="recipe.id" class="p-4">
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
            </div>

            <div v-else class="h-full flex items-center justify-center text-center p-6">
              <div>
                <p class="text-muted-foreground">No recent recipes yet. Start exploring!</p>
                <Button variant="outline" class="mt-2" @click="emit('navigate', 'recipes')">
                  Browse Recipes
                </Button>
              </div>
            </div>
          </CardContent>
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