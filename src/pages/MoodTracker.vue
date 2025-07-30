<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Recipe } from '@/types/recipe';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Smile, Frown, AngryIcon, Clock, Cloudy, Meh, Leaf, AlertTriangle } from 'lucide-vue-next';

const props = defineProps<{
  recipes: Recipe[];
  preferences?: any;
}>();

const emit = defineEmits(['view-recipe']);

const selectedMood = ref<string | null>(null);
const ingredientText = ref('');

// Updated ingredient keywords for Indonesian cuisine
const ingredientKeywords = ['Ayam', 'Ikan', 'Daging', 'Sayur', 'Nasi', 'Mie', 'Tahu', 'Tempe', 'Telur', 'Sambal'];
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
  selectedMood.value = selectedMood.value === moodName ? null : moodName;
};

const toggleIngredient = (keyword: string) => {
  const index = activeIngredientKeywords.value.indexOf(keyword);
  if (index === -1) {
    activeIngredientKeywords.value.push(keyword);
  } else {
    activeIngredientKeywords.value.splice(index, 1);
  }
};

// Helper function to get primary diet for display
const getPrimaryDiet = (dietArray: string[]) => {
  if (!dietArray || dietArray.length === 0) return 'General';
  return dietArray[0];
};

// Helper function to check dietary preferences
const matchesDietaryPreferences = (recipe: Recipe) => {
  if (!props.preferences) return true;
  
  const userPreferences = props.preferences;
  const recipeDiets = recipe.diet || [];
  
  // Check vegetarian preference
  if (userPreferences.isVegetarian && !recipeDiets.includes('Vegetarian') && !recipeDiets.includes('Vegan')) {
    return false;
  }
  
  // Check vegan preference
  if (userPreferences.isVegan && !recipeDiets.includes('Vegan')) {
    return false;
  }
  
  // Check halal preference
  if (userPreferences.isHalal && !recipeDiets.includes('Halal')) {
    return false;
  }
  
  // Check gluten-free preference
  if (userPreferences.isGlutenFree && !recipeDiets.includes('Gluten-Free')) {
    return false;
  }
  
  return true;
};

// Helper function to check allergy compatibility
const isAllergyCompatible = (recipe: Recipe) => {
  if (!props.preferences || !props.preferences.allergies) return true;
  
  const userAllergies = props.preferences.allergies;
  const recipeAllergies = recipe.allergyWarning;
  
  // Check each allergy
  if (userAllergies.isNutAllergy && recipeAllergies.isNutAllergy) return false;
  if (userAllergies.isDairyAllergy && recipeAllergies.isDairyAllergy) return false;
  if (userAllergies.isEggAllergy && recipeAllergies.isEggAllergy) return false;
  if (userAllergies.isFishAllergy && recipeAllergies.isFishAllergy) return false;
  if (userAllergies.isShellfishAllergy && recipeAllergies.isShellfishAllergy) return false;
  
  return true;
};

// Helper function to get active allergies for display
const getActiveAllergies = (allergyWarning: Recipe['allergyWarning']) => {
  const allergyNames: Record<string, string> = {
    'isNutAllergy': 'Nuts',
    'isDairyAllergy': 'Dairy',
    'isEggAllergy': 'Eggs',
    'isFishAllergy': 'Fish',
    'isShellfishAllergy': 'Shellfish'
  };
  
  return Object.entries(allergyWarning)
    .filter(([_, hasAllergy]) => hasAllergy)
    .map(([allergyKey, _]) => allergyNames[allergyKey]);
};

const moodRecommendations = computed(() => {
  if (!selectedMood.value || !props.recipes) return [];
  
  const searchIngredientsFromText = ingredientText.value
    .toLowerCase()
    .split(',')
    .map(i => i.trim())
    .filter(i => i);
  
  const allSearchKeywords = [
    ...activeIngredientKeywords.value.map(k => k.toLowerCase()), 
    ...searchIngredientsFromText
  ];
  
  return props.recipes.filter(recipe => {
    // Check mood match
    const moodMatch = recipe.mood === selectedMood.value;
    if (!moodMatch) return false;

    // Check dietary preferences
    if (!matchesDietaryPreferences(recipe)) return false;
    
    // Check allergy compatibility
    if (!isAllergyCompatible(recipe)) return false;

    // Check ingredient requirements
    if (allSearchKeywords.length === 0) return true;
    
    return allSearchKeywords.every(searchIng => 
      recipe.ingredients?.some(recipeIng => 
        recipeIng.toLowerCase().includes(searchIng)
      )
    );
  });
});

// Get mood statistics
const moodStats = computed(() => {
  if (!props.recipes) return {};
  
  const stats: Record<string, number> = {};
  moods.forEach(mood => {
    stats[mood.name] = props.recipes.filter(recipe => recipe.mood === mood.name).length;
  });
  
  return stats;
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">What's your mood right now?</h2>
      <p class="text-muted-foreground mt-1">Select a mood to get personalized meal suggestions based on your preferences.</p>
    </div>
    
    <!-- Mood Selection Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <button 
        v-for="mood in moods" 
        :key="mood.name" 
        @click="handleMoodSelect(mood.name)" 
        :class="[
          mood.color, 
          selectedMood === mood.name 
            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-105' 
            : 'hover:scale-105'
        ]"
        class="p-6 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-200 relative"
      >
        <component :is="mood.icon" class="h-8 w-8" />
        <span class="font-semibold">{{ mood.name }}</span>
        <!-- Recipe count badge -->
        <span class="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center">
          {{ moodStats[mood.name] || 0 }}
        </span>
      </button>
    </div>
    
    <!-- Ingredient Input Section -->
    <Card>
      <CardHeader>
        <CardTitle>Have ingredients on hand?</CardTitle>
        <CardDescription>Enter what you have, or select from the keywords below to get more targeted suggestions.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <Textarea 
          v-model="ingredientText" 
          placeholder="e.g., chicken, rice, vegetables, tofu..." 
          class="flex-grow" 
        />
        <div class="flex flex-wrap gap-2">
          <Button 
            v-for="keyword in ingredientKeywords" 
            :key="keyword" 
            :variant="activeIngredientKeywords.includes(keyword) ? 'secondary' : 'outline'" 
            size="sm"
            @click="toggleIngredient(keyword)"
          >
            {{ keyword }}
          </Button>
        </div>
        
        <!-- Active filters display -->
        <div v-if="activeIngredientKeywords.length > 0 || ingredientText" class="flex flex-wrap gap-2 pt-2 border-t">
          <span class="text-sm text-muted-foreground">Active filters:</span>
          <Badge v-for="keyword in activeIngredientKeywords" :key="keyword" variant="secondary">
            {{ keyword }}
          </Badge>
          <Badge v-if="ingredientText" variant="secondary">
            Custom: {{ ingredientText }}
          </Badge>
        </div>
      </CardContent>
    </Card>
    
    <!-- Recommendations Section -->
    <div v-if="selectedMood">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-2xl font-bold tracking-tight">
          AI Recommendations for a <span class="text-emerald-500">{{ selectedMood }}</span> Mood
        </h3>
        <span class="text-sm text-muted-foreground">
          {{ moodRecommendations.length }} recipe{{ moodRecommendations.length !== 1 ? 's' : '' }} found
        </span>
      </div>
      
      <div v-if="moodRecommendations.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="recipe in moodRecommendations" :key="recipe.id" class="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
          <div class="relative">
            <img :src="recipe.image" :alt="recipe.title" class="w-full h-40 object-cover" />
            <!-- Favorite indicator -->
            <div v-if="recipe.favorite" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
            </div>
            <!-- Allergy warning -->
            <div v-if="getActiveAllergies(recipe.allergyWarning).length > 0" class="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
              <AlertTriangle class="h-4 w-4" />
            </div>
          </div>
          
          <CardHeader class="pb-2">
            <CardTitle class="line-clamp-2">{{ recipe.title }}</CardTitle>
            <CardDescription class="line-clamp-2 mt-1">{{ recipe.description }}</CardDescription>
          </CardHeader>
          
          <CardContent class="flex-grow flex flex-col justify-end">
            <!-- Recipe metadata -->
            <div class="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <div class="flex items-center gap-1">
                <Clock class="h-4 w-4" />
                <span>{{ recipe.time }} min</span>
              </div>
              <div class="flex items-center gap-1">
                <Leaf class="h-4 w-4" />
                <span>{{ getPrimaryDiet(recipe.diet) }}</span>
              </div>
            </div>
            
            <!-- Diet tags -->
            <div class="flex flex-wrap gap-1 mb-3">
              <Badge 
                v-for="diet in recipe.diet?.slice(0, 2)" 
                :key="diet"
                variant="outline"
                class="text-xs"
              >
                {{ diet }}
              </Badge>
              <Badge 
                v-if="recipe.diet && recipe.diet.length > 2"
                variant="outline"
                class="text-xs"
              >
                +{{ recipe.diet.length - 2 }}
              </Badge>
            </div>
            
            <!-- Allergy warning text -->
            <div v-if="getActiveAllergies(recipe.allergyWarning).length > 0" class="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
              ⚠️ Contains: {{ getActiveAllergies(recipe.allergyWarning).join(', ') }}
            </div>
            
            <Button class="w-full py-2" @click="emit('view-recipe', recipe)">
              View Recipe
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <!-- No results state -->
      <Card v-else class="border-dashed">
        <CardContent class="h-32 flex flex-col items-center justify-center text-center p-6">
          <Meh class="h-8 w-8 text-muted-foreground mb-2" />
          <h4 class="font-semibold mb-1">No matching recommendations</h4>
          <p class="text-sm text-muted-foreground">Try adjusting your ingredients or check your dietary preferences.</p>
        </CardContent>
      </Card>
    </div>
    
    <!-- Initial state -->
    <Card v-else class="border-dashed">
      <CardContent class="h-64 flex flex-col items-center justify-center text-center p-6">
        <Smile class="h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold">Ready for a recommendation?</h3>
        <p class="text-muted-foreground mb-4">Select a mood above to see personalized suggestions based on your preferences!</p>
        <div class="text-sm text-muted-foreground">
          Total recipes available: {{ recipes?.length || 0 }}
        </div>
      </CardContent>
    </Card>
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