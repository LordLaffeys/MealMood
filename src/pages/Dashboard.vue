<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Chart from 'primevue/chart';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

// Define the Recipe type here to scope it to this component
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

const props = defineProps<{
  recipes: Recipe[];
  isDarkMode: boolean;
}>();

const emit = defineEmits(['view-recipe', 'navigate']);

const dashboardMealType = ref('Breakfast');
const trendingRecipes = computed(() => props.recipes.filter(r => r.trending));
const lastPickedRecipes = computed(() => props.recipes.slice(-2));
const quickPicks = computed(() => props.recipes.filter(r => r.mealType === dashboardMealType.value).slice(0, 5));
const favoriteRecipes = computed(() => props.recipes.filter(r => r.favorite));

// Chart data and options
const weeklyChartData = ref();
const weeklyChartOptions = ref();

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--foreground').trim();
    const textColorSecondary = documentStyle.getPropertyValue('--muted-foreground').trim();
    
    weeklyChartData.value = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            { type: 'bar', label: 'Happy', backgroundColor: '#22c55e', data: [2, 3, 1, 4, 2, 3, 1], stack: 'moods', order: 2 },
            { type: 'bar', label: 'Sad', backgroundColor: '#3b82f6', data: [1, 0, 2, 0, 1, 0, 2], stack: 'moods', order: 2 },
            { type: 'bar', label: 'Angry', backgroundColor: '#ef4444', data: [0, 1, 0, 1, 0, 1, 0], stack: 'moods', order: 2 },
            { type: 'bar', label: 'Tired', backgroundColor: '#64748b', data: [3, 2, 4, 2, 3, 4, 3], stack: 'moods', order: 2 },
            { type: 'bar', label: 'Stressed', backgroundColor: '#8b5cf6', data: [1, 2, 1, 3, 2, 1, 2], stack: 'moods', order: 2 },
            { type: 'bar', label: 'Bored', backgroundColor: '#f59e0b', data: [1, 1, 0, 1, 1, 0, 1], stack: 'moods', order: 2, borderRadius: { topLeft: 30, topRight: 30 } },
            // 2. Ensured the line chart has a lower `order` to render it on top.
            { type: 'line', label: 'Health Score', borderColor: '#4f46e5', tension: 0.4, data: [75, 80, 65, 85, 70, 88, 60], yAxisID: 'y1', order: 1 }
        ]
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
                title: { display: true, text: 'Mood', color: textColorSecondary },
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

onMounted(setChartOptions);
watch(() => props.isDarkMode, setChartOptions);
</script>

<template>
  <div class="space-y-8">
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
          <Button @click="emit('navigate', 'moodtracker')" class="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 px-6 py-2 w-full sm:w-auto">Find a Meal</Button>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Your mood and health score trends for the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart type="bar" :data="weeklyChartData" :options="weeklyChartOptions" class="h-[350px]" />
        </CardContent>
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
              <Button variant="link" class="p-0 h-auto mt-2" @click="emit('view-recipe', recipe)">View Recipe</Button>
            </div>
          </Card>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div class="flex flex-col h-full">
                  <h3 class="text-2xl font-bold tracking-tight mb-4">Last Picked Recipes</h3>
                  <Card v-for="recipe in lastPickedRecipes" :key="recipe.id" class="flex flex-col md:flex-row items-center gap-8 p-6 h-full">
                    <img :src="recipe.image" :alt="recipe.title" class="w-full md:w-40 h-40 rounded-lg object-cover"/>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-primary">{{ recipe.mealType }}</p>
                      <p class="text-xl font-bold">{{ recipe.title }}</p>
                      <p class="text-muted-foreground mt-2">{{ recipe.description }}</p>
                      <DialogTrigger as-child>
                        <Button class="mt-4" @click="emit('view-recipe', recipe)">View Recipe Again</Button>
                      </DialogTrigger>
                    </div>
                  </Card>
                </div>
              <div class="flex flex-col h-full">
                <h3 class="text-2xl font-bold tracking-tight mb-4">Your Favorite Recipes</h3>
                <Card class="h-full">
                  <CardContent class="p-0 max-h-[400px] overflow-y-auto">
                      <div class="space-y-4 p-4">
                          <div v-for="recipe in favoriteRecipes" :key="recipe.id" class="flex items-center gap-4">
                              <img :src="recipe.image" :alt="recipe.title" class="w-16 h-16 rounded-lg object-cover" />
                              <div class="flex-1">
                                  <p class="font-semibold">{{ recipe.title }}</p>
                                  <p class="text-sm text-muted-foreground">{{ recipe.mealType }}</p>
                              </div>
                              <Button variant="secondary" size="sm" @click="emit('view-recipe', recipe)">View</Button>
                          </div>
                           <p v-if="!favoriteRecipes.length" class="text-center text-muted-foreground py-4">You haven't favorited any recipes yet.</p>
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
              <Button variant="outline" class="w-full" @click="emit('view-recipe', recipe)">View Recipe</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
</template>