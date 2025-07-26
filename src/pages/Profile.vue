<script setup lang="ts">
import { ref, computed, watch, onMounted, inject } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// Firebase imports
import { useCurrentUser } from 'vuefire';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';

// Inject toast function
const showToast = inject('showToast') as (type: 'success' | 'error', message: string, description: string) => void;

// Props from App.vue
const props = defineProps({
  preferences: {
    type: Object,
    required: true,
  },
  isDarkMode: {
    type: Boolean,
    required: true,
  }
});

// Emits
const emit = defineEmits(['toggle-dark-mode']);

// Firebase setup
const user = useCurrentUser();
const db = getFirestore();

// User data state
const userData = ref({
  name: '',
  email: '',
  preferences: {
    isVegetarian: false,
    isVegan: false,
    isHalal: false,
    isGlutenFree: false,
    isLactoseIntolerant: false,
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
  },
  darkMode: false,
});

// Original data for comparison
const originalData = ref({});

// Loading states
const isLoading = ref(true);
const isSaving = ref(false);

// Fetch user data from Firebase
const fetchUserData = () => {
  if (!user.value) return;

  const userDocRef = doc(db, 'users', user.value.uid);
  
  onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Update userData with fetched data
      userData.value = {
        name: data.name || user.value?.displayName || '',
        email: data.email || user.value?.email || '',
        preferences: {
          isVegetarian: data.preferences?.isVegetarian || false,
          isVegan: data.preferences?.isVegan || false,
          isHalal: data.preferences?.isHalal || false,
          isGlutenFree: data.preferences?.isGlutenFree || false,
          isLactoseIntolerant: data.preferences?.isLactoseIntolerant || false,
          cuisines: {
            Javanese: data.preferences?.cuisines?.Javanese || false,
            Padang: data.preferences?.cuisines?.Padang || false,
            Sundanese: data.preferences?.cuisines?.Sundanese || false,
            ChineseIndonesian: data.preferences?.cuisines?.ChineseIndonesian || false,
            ComfortFood: data.preferences?.cuisines?.ComfortFood || false,
            Japanese: data.preferences?.cuisines?.Japanese || false,
            SpicyFood: data.preferences?.cuisines?.SpicyFood || false,
            StreetFood: data.preferences?.cuisines?.StreetFood || false,
            Nusantara: data.preferences?.cuisines?.Nusantara || false,
          }
        },
        allergies: {
          isNutAllergy: data.allergies?.isNutAllergy || false,
          isDairyAllergy: data.allergies?.isDairyAllergy || false,
          isEggAllergy: data.allergies?.isEggAllergy || false,
          isFishAllergy: data.allergies?.isFishAllergy || false,
          isShellfishAllergy: data.allergies?.isShellfishAllergy || false,
        },
        darkMode: data.darkMode || false,
      };

      // Store original data for comparison
      originalData.value = JSON.parse(JSON.stringify(userData.value));
      isLoading.value = false;
    }
  }, (error) => {
    console.error('Error fetching user data:', error);
    showToast('error', 'Error', 'Failed to load user data');
    isLoading.value = false;
  });
};

// Check if there are changes
const hasChanges = computed(() => {
  if (isLoading.value) return false;
  
  const current = JSON.stringify({
    name: userData.value.name,
    preferences: userData.value.preferences,
    allergies: userData.value.allergies,
    darkMode: userData.value.darkMode,
  });
  
  const original = JSON.stringify({
    name: originalData.value.name,
    preferences: originalData.value.preferences,
    allergies: originalData.value.allergies,
    darkMode: originalData.value.darkMode,
  });
  
  return current !== original;
});

// Save changes to Firebase
const saveChanges = async () => {
  if (!user.value || !hasChanges.value) return;
  
  isSaving.value = true;
  
  try {
    const userDocRef = doc(db, 'users', user.value.uid);
    
    await updateDoc(userDocRef, {
      name: userData.value.name,
      preferences: userData.value.preferences,
      allergies: userData.value.allergies,
      darkMode: userData.value.darkMode,
    });
    
    // Update original data
    originalData.value = JSON.parse(JSON.stringify(userData.value));
    
    showToast('success', 'Settings Saved', 'Your preferences have been updated successfully');
  } catch (error) {
    console.error('Error saving preferences:', error);
    showToast('error', 'Save Failed', 'Failed to save your preferences. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Handle dark mode toggle
const toggleDarkMode = () => {
  userData.value.darkMode = !userData.value.darkMode;
  emit('toggle-dark-mode');
};

// Data structure for form sections
const preferenceSections = {
  'Dietary Preferences': {
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

// Initialize when component mounts
onMounted(() => {
  fetchUserData();
});

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    fetchUserData();
  }
}, { immediate: true });
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Profile Settings</h1>
      <p class="text-muted-foreground mt-2">Manage your account preferences and dietary information.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span class="ml-2 text-muted-foreground">Loading your profile...</span>
    </div>

    <!-- Profile Content -->
    <div v-else class="space-y-6">
      <!-- Personal Information Card -->
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic account information.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Display Name</Label>
            <Input 
              id="name" 
              v-model="userData.name"
              placeholder="Enter your display name" 
            />
          </div>
          <div class="space-y-2">
            <Label>Email Address</Label>
            <div 
              class="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-60 pointer-events-none select-none"
              tabindex="-1"
            >
              {{ userData.email }}
            </div>
            <p class="text-xs text-muted-foreground">Email cannot be changed from this page.</p>
          </div>
        </CardContent>
      </Card>

      <!-- App Settings Card -->
      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>Customize your app experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Dark Mode</Label>
              <p class="text-sm text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Switch 
              :checked="userData.darkMode"
              @update:checked="toggleDarkMode"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Dietary Preferences Card -->
      <Card>
        <CardHeader>
          <CardTitle>Food Preferences</CardTitle>
          <CardDescription>Tell us about your dietary needs and preferences.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-8">
          <!-- Dietary Preferences and Allergies -->
          <div v-for="(section, sectionTitle) in preferenceSections" :key="sectionTitle" class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">{{ sectionTitle }}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div v-for="(label, key) in section.options" :key="key" class="flex items-center space-x-2">
                <Checkbox 
                  :id="key" 
                  v-model="userData[section.field][key]" 
                />
                <Label :for="key" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {{ label }}
                </Label>
              </div>
            </div>
          </div>

          <!-- Favorite Cuisines -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">Favorite Cuisines</h3>
            <p class="text-sm text-muted-foreground">Select cuisines you enjoy for personalized recommendations.</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div v-for="(label, key) in cuisineOptions" :key="key" class="flex items-center space-x-2">
                <Checkbox 
                  :id="`cuisine-${key}`" 
                  v-model="userData.preferences.cuisines[key]" 
                />
                <Label :for="`cuisine-${key}`" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {{ label }}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Save Button -->
      <div class="flex justify-end">
        <Button 
          @click="saveChanges"
          :disabled="!hasChanges || isSaving"
          :class="[
            'transition-all duration-300',
            !hasChanges ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
          ]"
        >
          <div v-if="isSaving" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>
    </div>
  </div>
</template>