<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Leaf } from 'lucide-vue-next';

// Define the Recipe type to match Firestore structure
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
  favorite?: boolean;
  trending?: boolean;
}

const props = defineProps<{
  recipes: Recipe[];
  preferences?: any;
}>();

const emit = defineEmits(['view-recipe']);

const searchTerm = ref('');
const debouncedSearchTerm = ref('');
watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 300));

const mealTypeFilter = ref('All');
const cuisineFilter = ref('All');
const dietFilter = ref('All');

// Updated ingredient keywords to be more relevant to Indonesian cuisine
const ingredientKeywords = ['Chicken', 'Fish', 'Beef', 'Vegetables', 'Rice', 'Noodles', 'Tofu', 'Tempeh'];
const recipePageActiveKeywords = ref<string[]>([]);

const toggleRecipePageIngredient = (keyword: string) => {
  const index = recipePageActiveKeywords.value.indexOf(keyword);
  if (index === -1) {
    recipePageActiveKeywords.value.push(keyword);
  } else {
    recipePageActiveKeywords.value.splice(index, 1);
  }
};

// Get unique cuisine types from recipes
const availableCuisines = computed(() => {
  const cuisineSet = new Set<string>();
  props.recipes?.forEach(recipe => {
    Object.entries(recipe.cuisine).forEach(([cuisine, isActive]) => {
      if (isActive) {
        cuisineSet.add(cuisine);
      }
    });
  });
  return Array.from(cuisineSet);
});

// Get unique diet types from recipes
const availableDiets = computed(() => {
  const dietSet = new Set<string>();
  props.recipes?.forEach(recipe => {
    recipe.diet?.forEach(diet => {
      dietSet.add(diet);
    });
  });
  return Array.from(dietSet);
});

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

// Helper function to get primary diet for display
const getPrimaryDiet = (dietArray: string[]) => {
  if (!dietArray || dietArray.length === 0) return 'General';
  return dietArray[0];
};

// Helper function to check if recipe matches cuisine filter
const matchesCuisineFilter = (recipe: Recipe) => {
  if (cuisineFilter.value === 'All') return true;
  return recipe.cuisine[cuisineFilter.value as keyof typeof recipe.cuisine] === true;
};

// Helper function to check if recipe matches diet filter
const matchesDietFilter = (recipe: Recipe) => {
  if (dietFilter.value === 'All') return true;
  return recipe.diet?.includes(dietFilter.value) || false;
};

const filteredRecipes = computed(() => {
  if (!props.recipes) return [];
  
  const activeKeywords = recipePageActiveKeywords.value.map(k => k.toLowerCase());
  
  return props.recipes.filter(recipe => {
    // Search term matching
    const matchesSearch = recipe.title.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase()) || 
                         recipe.description.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase());
    
    // Meal type matching
    const matchesMealType = mealTypeFilter.value === 'All' || recipe.mealType === mealTypeFilter.value;
    
    // Cuisine matching
    const matchesCuisine = matchesCuisineFilter(recipe);
    
    // Diet matching
    const matchesDiet = matchesDietFilter(recipe);
    
    if (!matchesSearch || !matchesMealType || !matchesCuisine || !matchesDiet) return false;

    // Ingredient keyword matching
    if (activeKeywords.length === 0) return true;
    
    return activeKeywords.every(searchIng => 
      recipe.ingredients?.some(recipeIng => 
        recipeIng.toLowerCase().includes(searchIng)
      )
    );
  });
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Explore Recipes</h2>
      <p class="text-muted-foreground mt-1">Find your next favorite meal from our collection.</p>
    </div>
    
    <!-- Filters Section -->
    <div class="space-y-4">
      <!-- Search and Main Filters -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:space-x-2 space-y-4 lg:space-y-0">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input v-model="searchTerm" placeholder="Search for a recipe..." class="pl-10" />
        </div>
        
        <Select v-model="mealTypeFilter">
          <SelectTrigger class="w-full lg:w-[180px]">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Meal Types</SelectItem>
            <SelectItem value="Breakfast">Breakfast</SelectItem>
            <SelectItem value="Lunch">Lunch</SelectItem>
            <SelectItem value="Dinner">Dinner</SelectItem>
            <SelectItem value="Snack">Snack</SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="cuisineFilter">
          <SelectTrigger class="w-full lg:w-[180px]">
            <SelectValue placeholder="Select cuisine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Cuisines</SelectItem>
            <SelectItem 
              v-for="cuisine in availableCuisines" 
              :key="cuisine" 
              :value="cuisine"
            >
              {{ getCuisineDisplayName(cuisine) }}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select v-model="dietFilter">
          <SelectTrigger class="w-full lg:w-[180px]">
            <SelectValue placeholder="Select diet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Diets</SelectItem>
            <SelectItem 
              v-for="diet in availableDiets" 
              :key="diet" 
              :value="diet"
            >
              {{ diet }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Ingredient Keywords -->
      <div class="flex flex-wrap gap-2">
        <Button 
          v-for="keyword in ingredientKeywords" 
          :key="keyword" 
          :variant="recipePageActiveKeywords.includes(keyword) ? 'secondary' : 'outline'" 
          size="sm"
          @click="toggleRecipePageIngredient(keyword)"
        >
          {{ keyword }}
        </Button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-muted-foreground">
      Showing {{ filteredRecipes.length }} recipe{{ filteredRecipes.length !== 1 ? 's' : '' }}
    </div>
    
    <!-- Recipe Grid -->
    <div v-if="filteredRecipes.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="recipe in filteredRecipes" :key="recipe.id" class="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
        <div class="relative">
          <img :src="recipe.image" :alt="recipe.title" class="w-full h-60 object-cover" />
          <!-- Favorite indicator -->
          <div v-if="recipe.favorite" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </div>
          <!-- Trending indicator -->
          <div v-if="recipe.trending" class="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Trending
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
            <span 
              v-for="diet in recipe.diet?.slice(0, 3)" 
              :key="diet"
              class="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
            >
              {{ diet }}
            </span>
            <span 
              v-if="recipe.diet && recipe.diet.length > 3"
              class="text-xs text-muted-foreground"
            >
              +{{ recipe.diet.length - 3 }} more
            </span>
          </div>
          
          <Button class="w-full py-2" @click="emit('view-recipe', recipe)">
            View Recipe
          </Button>
        </CardContent>
      </Card>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🍽️</div>
      <h3 class="text-lg font-semibold mb-2">No recipes found</h3>
      <p class="text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
      <Button 
        variant="outline" 
        @click="() => {
          searchTerm = '';
          mealTypeFilter = 'All';
          cuisineFilter = 'All';
          dietFilter = 'All';
          recipePageActiveKeywords = [];
        }"
      >
        Clear All Filters
      </Button>
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