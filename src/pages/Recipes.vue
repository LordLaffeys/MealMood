<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Leaf } from 'lucide-vue-next';

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
}>();

const emit = defineEmits(['view-recipe']);

const searchTerm = ref('');
const debouncedSearchTerm = ref('');
watch(searchTerm, debounce((newValue: string) => {
  debouncedSearchTerm.value = newValue;
}, 300));

const mealTypeFilter = ref('All');
const cuisineFilter = ref('All');
const ingredientKeywords = ['Chicken', 'Fish', 'Beef', 'Vegetables', 'Pasta', 'Rice'];
const recipePageActiveKeywords = ref<string[]>([]);

const toggleRecipePageIngredient = (keyword: string) => {
  const index = recipePageActiveKeywords.value.indexOf(keyword);
  if (index === -1) {
    recipePageActiveKeywords.value.push(keyword);
  } else {
    recipePageActiveKeywords.value.splice(index, 1);
  }
};

const filteredRecipes = computed(() => {
  const activeKeywords = recipePageActiveKeywords.value.map(k => k.toLowerCase());
  return props.recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase()) || 
                         recipe.description.toLowerCase().includes(debouncedSearchTerm.value.toLowerCase());
    const matchesMealType = mealTypeFilter.value === 'All' || recipe.mealType === recipe.mealType;
    const matchesCuisine = cuisineFilter.value === 'All' || recipe.cuisine === cuisineFilter.value;
    
    if (!matchesSearch || !matchesMealType || !matchesCuisine) return false;

    if (activeKeywords.length === 0) return true;
    
    return activeKeywords.every(searchIng => recipe.ingredients?.some(recipeIng => recipeIng.toLowerCase().includes(searchIng)));
  });
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Explore Recipes</h2>
      <p class="text-muted-foreground mt-1">Find your next favorite meal from our collection.</p>
    </div>
    <div class="space-y-4">
      <div class="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-4 md:space-y-0">
        <div class="relative flex-1">
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
        <Select v-model="cuisineFilter">
          <SelectTrigger> <SelectValue placeholder="Select a cuisine" /> </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Cuisines</SelectItem>
            <SelectItem value="American">American</SelectItem>
            <SelectItem value="Italian">Italian</SelectItem>
            <SelectItem value="Mexican">Mexican</SelectItem>
            <SelectItem value="Asian">Asian</SelectItem>
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
          <Button class="w-full mt-4 py-2" @click="emit('view-recipe', recipe)">View Recipe</Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>