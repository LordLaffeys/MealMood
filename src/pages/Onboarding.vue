<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Leaf, Salad, WheatOff, Drumstick } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

defineProps<{
  preferences: Record<string, boolean>;
}>();

const emit = defineEmits(['onboarding-complete']);

const handleOnboardingComplete = () => {
  toast.success('Preferences Saved!', { description: 'Welcome to MealMood!' });
  emit('onboarding-complete');
};
</script>

<template>
  <div class="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
    <Card class="w-full max-w-2xl">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Tell us about yourself</CardTitle>
        <CardDescription>These preferences will help us tailor your meal recommendations.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <Label class="font-semibold">Dietary Needs & Restrictions</Label>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between rounded-lg border p-3">
              <Label for="vegetarian" class="flex items-center gap-2"><Leaf class="h-4 w-4" /> Vegetarian</Label>
              <Switch id="vegetarian" v-model:checked="preferences.isVegetarian" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-3">
              <Label for="vegan" class="flex items-center gap-2"><Salad class="h-4 w-4" /> Vegan</Label>
              <Switch id="vegan" v-model:checked="preferences.isVegan" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-3">
              <Label for="gluten-free" class="flex items-center gap-2"><WheatOff class="h-4 w-4" /> Gluten-Free</Label>
              <Switch id="gluten-free" v-model:checked="preferences.isGlutenFree" />
            </div>
            <div class="flex items-center justify-between rounded-lg border p-3">
              <Label for="nut-allergy" class="flex items-center gap-2"><Drumstick class="h-4 w-4" /> Nut Allergy</Label>
              <Switch id="nut-allergy" v-model:checked="preferences.hasNutAllergy" />
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label class="font-semibold">Preferred Cuisines</Label>
          <ToggleGroup type="multiple" variant="outline">
            <ToggleGroupItem value="italian">Italian</ToggleGroupItem>
            <ToggleGroupItem value="mexican">Mexican</ToggleGroupItem>
            <ToggleGroupItem value="asian">Asian</ToggleGroupItem>
            <ToggleGroupItem value="american">American</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div class="space-y-2">
          <Label class="font-semibold">Preferred Meal Types</Label>
          <ToggleGroup type="multiple" variant="outline">
            <ToggleGroupItem value="breakfast">Breakfast</ToggleGroupItem>
            <ToggleGroupItem value="lunch">Lunch</ToggleGroupItem>
            <ToggleGroupItem value="dinner">Dinner</ToggleGroupItem>
            <ToggleGroupItem value="snacks">Snacks</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <Button @click="handleOnboardingComplete" class="w-full">Save & Continue</Button>
      </CardContent>
    </Card>
  </div>
</template>