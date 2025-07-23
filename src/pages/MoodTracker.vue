<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Smile, Frown, AngryIcon, Clock, Cloudy, Meh, Leaf } from 'lucide-vue-next';

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
  preferences: Record<string, boolean>;
}>();

const emit = defineEmits(['view-recipe']);

const selectedMood = ref<string | null>(null);
const ingredientText = ref('');
const ingredientKeywords = ['Chicken', 'Fish', 'Beef', 'Vegetables', 'Pasta', 'Rice'];
const activeIngredientKeywords = ref<string[]>([]);

const moods = [
  { name: "Happy", icon: Smile, color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  { name: "Sad", icon: Frown, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { name: "Angry", icon: AngryIcon, color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  { name: "Tired", icon: Clock, color: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300" },
  { name: "Stressed", icon: Cloudy, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  { name: "Bored", icon: Meh, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
];

const handleMoodSelect = (moodName: string) => {
  selectedMood.value = moodName;
};

const toggleIngredient = (keyword: string) => {
  const index = activeIngredientKeywords.value.indexOf(keyword);
  if (index === -1) {
    activeIngredientKeywords.value.push(keyword);
  } else {
    activeIngredientKeywords.value.splice(index, 1);
  }
};

const moodRecommendations = computed(() => {
  if (!selectedMood.value) return [];
  const searchIngredientsFromText = ingredientText.value.toLowerCase().split(',').map(i => i.trim()).filter(i => i);
  const allSearchKeywords = [...activeIngredientKeywords.value.map(k => k.toLowerCase()), ...searchIngredientsFromText];
  
  return props.recipes.filter(recipe => {
    const moodMatch = recipe.mood === selectedMood.value;
    if (!moodMatch) return false;

    const matchesPreferences = 
      (!props.preferences.isVegetarian || recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan') &&
      (!props.preferences.isVegan || recipe.diet === 'Vegan') &&
      (!props.preferences.isGlutenFree || recipe.diet === 'Gluten-Free') &&
      (!props.preferences.hasNutAllergy || !recipe.ingredients.some(ing => ing.toLowerCase().includes('nut')));
    if (!matchesPreferences) return false;

    if (allSearchKeywords.length === 0) return true;
    
    return allSearchKeywords.every(searchIng => recipe.ingredients?.some(recipeIng => recipeIng.toLowerCase().includes(searchIng)));
  });
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">What's your mood right now?</h2>
      <p class="text-muted-foreground mt-1">Select a mood to get personalized meal suggestions.</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <button 
        v-for="mood in moods" 
        :key="mood.name" 
        @click="handleMoodSelect(mood.name)" 
        :class="[mood.color, selectedMood === mood.name ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : 'hover:scale-105']"
        class="p-6 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-200"
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
            <Button class="w-full mt-4 py-2" @click="emit('view-recipe', recipe)">View Recipe</Button>
          </CardContent>
        </Card>
      </div>
      <p v-else class="text-muted-foreground text-center py-8">No matching recommendations for this mood and ingredients. Try another combination!</p>
    </div>
    <Card v-else class="border-dashed">
      <CardContent class="h-64 flex flex-col items-center justify-center text-center p-6">
        <Smile class="h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold">Ready for a recommendation?</h3>
        <p class="text-muted-foreground">Select a mood above to see what we suggest!</p>
      </CardContent>
    </Card>
  </div>
</template>