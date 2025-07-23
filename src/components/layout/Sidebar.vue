<script setup lang="ts">
import { Home, Smile, Soup, User, UtensilsCrossed } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

defineProps<{
  currentPage: string;
}>();

const emit = defineEmits(['navigate']);
</script>

<template>
  <aside class="hidden md:flex flex-col w-64 bg-card border-r p-4 space-y-2">
    <div class="flex items-center space-x-2 px-4 pb-4">
      <UtensilsCrossed class="h-8 w-8" />
      <h1 class="text-2xl font-bold">MealMood</h1>
    </div>
    <Button :variant="currentPage === 'dashboard' ? 'secondary' : 'ghost'" @click="emit('navigate', 'dashboard')" class="w-full justify-start text-base px-4 py-3">
      <Home class="mr-3 h-5 w-5" /> Dashboard
    </Button>
    <Button :variant="currentPage === 'moodtracker' ? 'secondary' : 'ghost'" @click="emit('navigate', 'moodtracker')" class="w-full justify-start text-base px-4 py-3">
      <Smile class="mr-3 h-5 w-5" /> Mood Tracker
    </Button>
    <Button :variant="currentPage === 'recipes' ? 'secondary' : 'ghost'" @click="emit('navigate', 'recipes')" class="w-full justify-start text-base px-4 py-3">
      <Soup class="mr-3 h-5 w-5" /> Recipes
    </Button>
    <Button :variant="currentPage === 'profile' ? 'secondary' : 'ghost'" @click="emit('navigate', 'profile')" class="w-full justify-start text-base px-4 py-3">
      <User class="mr-3 h-5 w-5" /> Profile
    </Button>
  </aside>
</template>