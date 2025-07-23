<script setup lang="ts">
import { computed } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Leaf, Smile } from 'lucide-vue-next';

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
  recipe: Recipe | null;
}>();

const emit = defineEmits(['close', 'toggle-favorite']);

const isOpen = computed({
  get: () => !!props.recipe,
  set: (value) => {
    if (!value) {
      emit('close');
    }
  }
});
</script>

<template>
  <Dialog :open="isOpen" @update:open="isOpen = false">
    <DialogContent v-if="recipe" class="sm:max-w-[625px] grid-rows-[auto_1fr_auto] p-0 max-h-[90vh]">
      <img :src="recipe.image" :alt="recipe.title" class="w-full h-60 object-cover rounded-t-lg">
      <DialogHeader class="p-6">
        <DialogTitle class="text-2xl font-bold">{{ recipe.title }}</DialogTitle>
        <DialogDescription class="text-md">{{ recipe.description }}</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 px-6 pb-6 overflow-y-auto">
        <div class="flex items-center justify-around bg-muted p-3 rounded-lg text-sm">
          <div class="flex items-center gap-2"><Clock class="h-5 w-5 text-muted-foreground" /> <span>{{ recipe.time }} min</span></div>
          <div class="flex items-center gap-2"><Leaf class="h-5 w-5 text-muted-foreground" /> <span>{{ recipe.diet }}</span></div>
          <div class="flex items-center gap-2"><Smile class="h-5 w-5 text-muted-foreground" /> <span>{{ recipe.mood }} Mood</span></div>
        </div>
        <div>
          <h3 class="font-semibold text-lg mb-2">Ingredients</h3>
          <ul class="list-disc list-inside space-y-1 text-muted-foreground">
            <li v-for="ingredient in recipe.ingredients" :key="ingredient">{{ ingredient }}</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-lg mb-2">Instructions</h3>
          <ol class="list-decimal list-inside space-y-2 text-muted-foreground">
            <li v-for="step in recipe.instructions" :key="step">{{ step }}</li>
          </ol>
        </div>
      </div>
      <DialogFooter class="p-6 pt-0 sm:justify-between">
        <Button variant="ghost" @click="emit('toggle-favorite', recipe.id)">
          <Heart class="h-5 w-5 mr-2" :class="{'text-red-500 fill-current': recipe.favorite}" />
          {{ recipe.favorite ? 'Favorited' : 'Add to Favorites' }}
        </Button>
        <Button type="button" variant="secondary" @click="emit('close')">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>