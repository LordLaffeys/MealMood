<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Define the props that this component receives from App.vue
const props = defineProps({
  preferences: {
    type: Object,
    required: true,
  }
});

// Define the event that this component can emit back to App.vue
const emit = defineEmits(['onboarding-complete']);

// --- FIXED: Use reactive() for nested objects and ensure all properties exist ---
const localUserData = reactive({
  preferences: {
    // Dietary preferences
    isVegetarian: false,
    isVegan: false,
    isHalal: false,
    isGlutenFree: false,
    isLactoseIntolerant: false,
    // Cuisines nested under preferences
    cuisines: {
      Javanese: false,
      Padang: false,
      Sundanese: false,
      ChineseIndonesian: false,
      ComfortFood: false,
      Japanese: false,
      SpicyFood: false,
      StreetFood: false,
      Nusantara: false,
    }
  },
  allergies: {
    isNutAllergy: false,
    isDairyAllergy: false,
    isEggAllergy: false,
    isFishAllergy: false,
    isShellfishAllergy: false,
  }
});

// Initialize with props data if available
if (props.preferences) {
  // Merge props data while keeping the reactive structure
  Object.assign(localUserData.preferences, props.preferences.preferences || {});
  Object.assign(localUserData.allergies, props.preferences.allergies || {});
  if (props.preferences.preferences?.cuisines) {
    Object.assign(localUserData.preferences.cuisines, props.preferences.preferences.cuisines);
  }
}

// Watch for changes in the prop and update the local copy if needed.
watch(() => props.preferences, (newVal) => {
  if (newVal) {
    Object.assign(localUserData.preferences, newVal.preferences || {});
    Object.assign(localUserData.allergies, newVal.allergies || {});
    if (newVal.preferences?.cuisines) {
      Object.assign(localUserData.preferences.cuisines, newVal.preferences.cuisines);
    }
  }
}, { deep: true });

// This function is called when the user clicks the "Finish" button.
const finishOnboarding = () => {
  // Emit the complete data structure
  emit('onboarding-complete', localUserData);
};

// Data structure to handle nesting
const preferenceSections = {
  'Dietary Needs': {
    field: 'preferences', // The key in localUserData
    options: {
      isVegetarian: 'Vegetarian',
      isVegan: 'Vegan',
      isHalal: 'Halal',
      isGlutenFree: 'Gluten-Free',
      isLactoseIntolerant: 'Lactose Intolerant',
    }
  },
  'Allergies': {
    field: 'allergies', // The key in localUserData
    options: {
      isNutAllergy: 'Nut Allergy',
      isDairyAllergy: 'Dairy Allergy',
      isEggAllergy: 'Egg Allergy',
      isFishAllergy: 'Fish Allergy',
      isShellfishAllergy: 'Shellfish Allergy',
    }
  }
};

const cuisineOptions = {
    Javanese: 'Javanese',
    Padang: 'Padang',
    Sundanese: 'Sundanese',
    Nusantara: 'Nusantara',
    ComfortFood: 'Comfort Food',
    Japanese: 'Japanese',
    SpicyFood: 'Spicy Food',
    StreetFood: 'Street Food',
    ChineseIndonesian: 'Chinese-Indonesian',
};

</script>

<template>
  <div class="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
    <Card class="w-full max-w-2xl">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl font-bold">Welcome to MealMood!</CardTitle>
        <CardDescription>Let's personalize your experience. Tell us a bit about your food preferences.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-8 p-6">
        
        <!-- Template loop to handle nested data -->
        <div v-for="(section, sectionTitle) in preferenceSections" :key="sectionTitle" class="space-y-4">
          <h3 class="text-lg font-semibold border-b pb-2">{{ sectionTitle }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="(label, key) in section.options" :key="key" class="flex items-center space-x-2">
              <!-- The v-model now correctly points to the nested property -->
              <!-- <Checkbox :id="key" v-model="localUserData[section.field][key]" /> -->
              <Label :for="key" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ label }}
              </Label>
            </div>
          </div>
        </div>

        <!-- Favorite Cuisines Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold border-b pb-2">Favorite Cuisines</h3>
          <p class="text-sm text-muted-foreground">Select any cuisines you enjoy. This will help us recommend recipes you'll love.</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div v-for="(label, key) in cuisineOptions" :key="key" class="flex items-center space-x-2">
               <!-- The v-model now correctly points to the nested property -->
              <Checkbox :id="`cuisine-${key}`" v-model="localUserData.preferences.cuisines[key]" />
              <Label :for="`cuisine-${key}`" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ label }}
              </Label>
            </div>
          </div>
        </div>

        <!-- Debug section - remove this after testing -->
        <div class="mt-4 p-4 bg-gray-100 rounded text-xs">
          <details>
            <summary>Debug: Current localUserData values</summary>
            <pre>{{ JSON.stringify(localUserData, null, 2) }}</pre>
          </details>
        </div>
      </CardContent>
      <CardFooter>
        <Button @click="finishOnboarding" class="w-full sm:w-auto sm:ml-auto">
          Save Preferences & Continue
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>