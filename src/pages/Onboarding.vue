<script setup lang="ts">
import { watch, reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Import your types
import type { UserPreferences, UserAllergies } from '@/types/recipe';

// Define the complete user data structure with proper typing
interface UserData {
  preferences: UserPreferences;
  allergies: UserAllergies;
}

// Define the props that this component receives from App.vue
const props = defineProps<{
  preferences: {
    preferences?: Partial<UserPreferences>;
    allergies?: Partial<UserAllergies>;
    isDarkMode?: boolean;
  };
}>();

// Define the event that this component can emit back to App.vue
const emit = defineEmits<{
  'onboarding-complete': [userData: UserData];
}>();

// Use reactive with proper typing
const localUserData = reactive<UserData>({
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

// Define properly typed section configurations
interface SectionConfig {
  field: keyof UserData;
  options: Record<string, string>;
}

// Data structure to handle nesting with proper typing
const preferenceSections: Record<string, SectionConfig> = {
  'Dietary Needs': {
    field: 'preferences',
    options: {
      isVegetarian: 'Vegetarian',
      isVegan: 'Vegan',
      isHalal: 'Halal',
      isGlutenFree: 'Gluten-Free',
      isLactoseIntolerant: 'Lactose Intolerant',
    }
  },
  'Allergies': {
    field: 'allergies',
    options: {
      isNutAllergy: 'Nut Allergy',
      isDairyAllergy: 'Dairy Allergy',
      isEggAllergy: 'Egg Allergy',
      isFishAllergy: 'Fish Allergy',
      isShellfishAllergy: 'Shellfish Allergy',
    }
  }
};

const cuisineOptions: Record<keyof UserPreferences['cuisines'], string> = {
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

// Helper function to get the correct model value with proper typing
const getModelValue = (sectionField: keyof UserData, key: string): boolean => {
  const section = localUserData[sectionField];
  return (section as any)[key] || false;
};

// Helper function to set the model value with proper typing
const setModelValue = (sectionField: keyof UserData, key: string, value: boolean): void => {
  const section = localUserData[sectionField] as any;
  section[key] = value;
};

// Helper functions for cuisines specifically
const getCuisineModelValue = (key: keyof UserPreferences['cuisines']): boolean => {
  return localUserData.preferences.cuisines[key];
};

const setCuisineModelValue = (key: keyof UserPreferences['cuisines'], value: boolean): void => {
  localUserData.preferences.cuisines[key] = value;
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
        
        <!-- Template loop to handle nested data with proper typing -->
        <div v-for="(section, sectionTitle) in preferenceSections" :key="sectionTitle" class="space-y-4">
          <h3 class="text-lg font-semibold border-b pb-2">{{ sectionTitle }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="(label, key) in section.options" :key="key" class="flex items-center space-x-2">
              <!-- FIXED: Use computed getter/setter pattern for proper typing -->
              <Checkbox 
                :id="key" 
                :modelValue="getModelValue(section.field, key)"
                @update:modelValue="(value) => setModelValue(section.field, key, value as boolean)"
              />
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
              <!-- FIXED: Use typed helper functions for cuisines -->
              <Checkbox 
                :id="`cuisine-${key}`" 
                :modelValue="getCuisineModelValue(key)"
                @update:modelValue="(value) => setCuisineModelValue(key, value as boolean)"
              />
              <Label :for="`cuisine-${key}`" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ label }}
              </Label>
            </div>
          </div>
        </div>

        <!-- Debug section - remove this after testing -->
        <!-- <div class="mt-4 p-4 bg-gray-100 rounded text-xs">
          <details>
            <summary>Debug: Current localUserData values</summary>
            <pre>{{ JSON.stringify(localUserData, null, 2) }}</pre>
          </details>
        </div> -->
      </CardContent>
      <CardFooter>
        <Button @click="finishOnboarding" class="w-full sm:w-auto sm:ml-auto">
          Save Preferences & Continue
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>