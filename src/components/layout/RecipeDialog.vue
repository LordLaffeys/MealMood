<script setup lang="ts">
import { computed } from 'vue';
import type { Recipe } from '@/types/recipe';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Leaf, Smile, AlertTriangle, ChefHat } from 'lucide-vue-next';

const props = defineProps<{
  recipe: Recipe | null;
}>();

const emit = defineEmits(['close', 'toggle-favorite', 'pick-recipe']);

const isOpen = computed({
  get: () => !!props.recipe,
  set: (value) => {
    if (!value) {
      emit('close');
    }
  }
});

// Helper function to get active cuisines as an array
const getActiveCuisines = (cuisine: Recipe['cuisine']) => {
  return Object.entries(cuisine)
    .filter(([_, isActive]) => isActive)
    .map(([cuisineName, _]) => cuisineName);
};

// Helper function to get cuisine display names
const getCuisineDisplayName = (cuisine: string) => {
  const displayNames: Record<string, string> = {
    'Javanese': 'Javanese',
    'Padang': 'Padang',
    'Sundanese': 'Sundanese',
    'Nusantara': 'Nusantara',
    'ComfortFood': 'Comfort Food',
    'Japanese': 'Japanese',
    'SpicyFood': 'Spicy Food',
    'StreetFood': 'Street Food',
    'ChineseIndonesian': 'Chinese Indonesian'
  };
  return displayNames[cuisine] || cuisine;
};

// Helper function to get active allergies
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

// Get primary diet for main display
const getPrimaryDiet = (dietArray: string[]) => {
  if (!dietArray || dietArray.length === 0) return 'General';
  return dietArray[0];
};

// Handle pick recipe click
const handlePickRecipe = () => {
  if (props.recipe) {
    emit('pick-recipe', props.recipe);
  }
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="isOpen = false">
    <DialogContent v-if="recipe" class="sm:max-w-[625px] grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]">
      <!-- Recipe Image -->
      <div class="relative">
        <img :src="recipe.image" :alt="recipe.title" class="w-full h-60 object-cover rounded-t-lg">
        <!-- Favorite indicator -->
        <div v-if="recipe.favorite" class="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2">
          <Heart class="h-4 w-4 fill-current" />
        </div>
      </div>
      
      <!-- Header -->
      <DialogHeader class="p-6">
        <DialogTitle class="text-2xl font-bold">{{ recipe.title }}</DialogTitle>
        <DialogDescription class="text-md">{{ recipe.description }}</DialogDescription>
      </DialogHeader>
      
      <!-- Content -->
      <div class="grid gap-4 px-6 pb-6 overflow-y-auto">
        <!-- Recipe Info -->
        <div class="flex items-center justify-around bg-muted p-3 rounded-lg text-sm">
          <div class="flex items-center gap-2">
            <Clock class="h-5 w-5 text-muted-foreground" />
            <span>{{ recipe.time }} min</span>
          </div>
          <div class="flex items-center gap-2">
            <Leaf class="h-5 w-5 text-muted-foreground" />
            <span>{{ getPrimaryDiet(recipe.diet) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Smile class="h-5 w-5 text-muted-foreground" />
            <span>{{ recipe.mood }} Mood</span>
          </div>
        </div>

        <!-- Diet Tags -->
        <div v-if="recipe.diet && recipe.diet.length > 0">
          <h4 class="font-medium mb-2">Diet Types</h4>
          <div class="flex flex-wrap gap-2">
            <Badge v-for="diet in recipe.diet" :key="diet" variant="secondary">
              {{ diet }}
            </Badge>
          </div>
        </div>

        <!-- Cuisine Tags -->
        <div v-if="getActiveCuisines(recipe.cuisine).length > 0">
          <h4 class="font-medium mb-2">Cuisine</h4>
          <div class="flex flex-wrap gap-2">
            <Badge 
              v-for="cuisine in getActiveCuisines(recipe.cuisine)" 
              :key="cuisine" 
              variant="outline"
            >
              {{ getCuisineDisplayName(cuisine) }}
            </Badge>
          </div>
        </div>

        <!-- Allergy Warning -->
        <div v-if="getActiveAllergies(recipe.allergyWarning).length > 0" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <AlertTriangle class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Allergy Warning</h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Contains: {{ getActiveAllergies(recipe.allergyWarning).join(', ') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div>
          <h3 class="font-semibold text-lg mb-2">Ingredients</h3>
          <ul class="list-disc list-inside space-y-1 text-muted-foreground">
            <li v-for="ingredient in recipe.ingredients" :key="ingredient">{{ ingredient }}</li>
          </ul>
        </div>

        <!-- Instructions -->
        <div>
          <h3 class="font-semibold text-lg mb-2">Instructions</h3>
          <ol class="list-decimal list-inside space-y-2 text-muted-foreground">
            <li v-for="(step, index) in recipe.instructions" :key="index">{{ step }}</li>
          </ol>
        </div>

        <!-- Meal Type Info -->
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-sm text-muted-foreground">
            <span class="font-medium">Meal Type:</span> {{ recipe.mealType }}
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <DialogFooter class="p-6 pt-0 sm:justify-between">
        <Button variant="ghost" @click="emit('toggle-favorite', recipe.id)">
          <Heart class="h-5 w-5 mr-2" :class="{'text-red-500 fill-current': recipe.favorite}" />
          {{ recipe.favorite ? 'Favorited' : 'Add to Favorites' }}
        </Button>
        <div class="flex gap-2">
          <Button type="button" variant="secondary" @click="emit('close')">
            Close
          </Button>
          <Button type="button" @click="handlePickRecipe" class="bg-primary hover:bg-primary/90">
            <ChefHat class="h-5 w-5 mr-2" />
            Pick Recipe
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>