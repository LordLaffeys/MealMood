<script setup lang="ts">
import { ref, inject } from 'vue'; // Added inject
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Leaf, Salad, WheatOff, Drumstick, Sun, Moon } from 'lucide-vue-next';
// Removed import { toast } from 'vue-sonner';

// Inject the global toast function
const showToast = inject('showToast') as (type: 'success' | 'error' | 'info', message: string, description: string) => void;

const props = defineProps<{
  preferences: Record<string, any>;
  isDarkMode: boolean;
}>();

const emit = defineEmits(['toggle-dark-mode', 'logout']); // Add 'logout' to emitted events

const preferredCuisines = ref(['italian']);
const preferredMealTypes = ref(['Breakfast', 'Dinner']);

const saveChanges = () => {
  // Using primevue toast
  showToast('success', 'Preferences Saved!', 'Your profile has been updated.');
}

const logout = () => {
  // Emit a logout event to the parent component
  // The parent component should handle the actual navigation (e.g., using Vue Router)
  emit('logout');
  // Using primevue toast
  showToast('info', 'Logging out...', 'Redirecting you to the authentication page.');
}
</script>

<template>
  <div class="space-y-8 max-w-2xl mx-auto">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Your Profile & Preferences</h2>
      <p class="text-muted-foreground mt-1">Manage your account and dietary needs.</p>
    </div>
    <Card>
      <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input id="name" value="Alex Doe" />
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" value="alex.doe@example.com" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Dietary Preferences</CardTitle>
        <CardDescription>Help us tailor recommendations for you.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <Label class="flex items-center gap-2"><Leaf class="h-4 w-4" /> Vegetarian</Label>
          <Switch v-model:checked="preferences.isVegetarian" />
        </div>
        <div class="flex items-center justify-between">
          <Label class="flex items-center gap-2"><Salad class="h-4 w-4" /> Vegan</Label>
          <Switch v-model:checked="preferences.isVegan" />
        </div>
        <div class="flex items-center justify-between">
          <Label class="flex items-center gap-2"><WheatOff class="h-4 w-4" /> Gluten-Free</Label>
          <Switch v-model:checked="preferences.isGlutenFree" />
        </div>
      </CardContent>
    </Card>
    <Card>
        <CardHeader><CardTitle>Allergies</CardTitle></CardHeader>
        <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Drumstick class="h-4 w-4" /> Nut Allergy</Label>
                <Switch v-model:checked="preferences.hasNutAllergy" />
            </div>
              <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Drumstick class="h-4 w-4" /> Dairy Allergy</Label>
                <Switch v-model:checked="preferences.hasDairyAllergy" />
            </div>
        </CardContent>
    </Card>
      <Card>
        <CardHeader><CardTitle>App Settings</CardTitle></CardHeader>
        <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
                <Label class="flex items-center gap-2"><Sun class="h-4 w-4 dark:hidden" /><Moon class="h-4 w-4 hidden dark:block" /> Dark Mode</Label>
                <Switch :checked="isDarkMode" @update:checked="emit('toggle-dark-mode')" />
            </div>
        </CardContent>
    </Card>
    <div class="flex justify-end gap-4"> <!-- Added gap-4 for spacing between buttons -->
      <Button @click="logout" variant="outline" class="px-8 py-2">Logout</Button> <!-- Logout button added -->
      <Button @click="saveChanges" class="px-8 py-2">Save Changes</Button>
    </div>
  </div>
</template>
