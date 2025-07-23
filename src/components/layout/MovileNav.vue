<script setup lang="ts">
import { Home, Smile, Soup, User } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

defineProps<{
  currentPage: string;
}>();

const emit = defineEmits(['navigate']);
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 z-20">
    <Button :variant="currentPage === 'dashboard' ? 'secondary' : 'ghost'" @click="emit('navigate', 'dashboard')" class="flex flex-col items-center h-14 w-16">
      <Home class="h-5 w-5" /><span class="text-xs mt-1">Home</span>
    </Button>
    <Button :variant="currentPage === 'moodtracker' ? 'secondary' : 'ghost'" @click="emit('navigate', 'moodtracker')" class="flex flex-col items-center h-14 w-16">
      <Smile class="h-5 w-5" /><span class="text-xs mt-1">Mood</span>
    </Button>
    <Button :variant="currentPage === 'recipes' ? 'secondary' : 'ghost'" @click="emit('navigate', 'recipes')" class="flex flex-col items-center h-14 w-16">
      <Soup class="h-5 w-5" /><span class="text-xs mt-1">Recipes</span>
    </Button>
    <Button :variant="currentPage === 'profile' ? 'secondary' : 'ghost'" @click="emit('navigate', 'profile')" class="flex flex-col items-center h-14 w-16">
      <User class="h-5 w-5" /><span class="text-xs mt-1">Profile</span>
    </Button>
  </nav>
</template>