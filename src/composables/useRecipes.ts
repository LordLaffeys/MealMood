import { ref, computed, watch } from 'vue'

// --- Mock Data (could be replaced with an API call in the future) ---
const mockRecipes = ref([
  { id: 4, title: "Avocado Toast with Egg", description: "A simple and satisfying breakfast.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/34d399/ffffff?text=Avocado+Toast", ingredients: ["Bread", "Avocado", "Egg", "Chili Flakes"], instructions: ["Toast your bread.", "Mash avocado on toast.", "Top with a fried egg."], mealType: "Breakfast", trending: true, favorite: true, cuisine: "American" },
  { id: 3, title: "Happy Chicken Salad", description: "A joyful and protein-packed salad.", mood: "Happy", time: 20, diet: "High-Protein", image: "https://placehold.co/600x400/fb923c/ffffff?text=Chicken+Salad", ingredients: ["Chicken", "Lettuce", "Tomatoes", "Avocado", "Vegetables"], instructions: ["Grill chicken breast.", "Chop vegetables.", "Combine and serve."], mealType: "Lunch", trending: true, favorite: false, cuisine: "American" },
  { id: 7, title: "15-Min Lemon Garlic Tilapia", description: "Super fast and light for when you're tired.", mood: "Tired", time: 15, diet: "High-Protein", image: "https://placehold.co/600x400/38bdf8/ffffff?text=Tilapia", ingredients: ["Tilapia", "Fish", "Garlic", "Lemon"], instructions: ["Season tilapia.", "Pan-sear for 3-4 mins per side.", "Squeeze lemon juice over."], mealType: "Dinner", trending: false, favorite: false, cuisine: "American" },
  { id: 1, title: "Hearty Lentil Soup", description: "A warm and comforting soup.", mood: "Stressed", time: 30, diet: "Vegan", image: "https://placehold.co/600x400/f87171/ffffff?text=Lentil+Soup", ingredients: ["Lentils", "Carrots", "Celery", "Onion", "Vegetables"], instructions: ["Sauté vegetables.", "Add lentils and broth.", "Simmer for 25 mins."], mealType: "Dinner", trending: true, favorite: false, cuisine: "Italian" },
  { id: 2, title: "Quinoa Salad", description: "A light and refreshing salad.", mood: "Happy", time: 15, diet: "Vegetarian", image: "https://placehold.co/600x400/4ade80/ffffff?text=Quinoa+Salad", ingredients: ["Quinoa", "Cucumber", "Tomatoes", "Feta", "Vegetables"], instructions: ["Cook quinoa.", "Chop vegetables.", "Combine and dress."], mealType: "Lunch", trending: false, favorite: true, cuisine: "American" },
  { id: 5, title: "Spicy Black Bean Burgers", description: "Flavor-packed burgers.", mood: "Angry", time: 40, diet: "Vegan", image: "https://placehold.co/600x400/a78bfa/ffffff?text=Bean+Burger", ingredients: ["Black Beans", "Breadcrumbs", "Onion", "Spices", "Vegetables"], instructions: ["Mash beans.", "Form patties.", "Cook on a skillet."], mealType: "Dinner", trending: false, favorite: false, cuisine: "Mexican" },
  { id: 6, title: "Creamy Tomato Pasta", description: "Classic comfort food.", mood: "Sad", time: 25, diet: "Vegetarian", image: "https://placehold.co/600x400/f472b6/ffffff?text=Tomato+Pasta", ingredients: ["Pasta", "Tomatoes", "Garlic", "Cream", "Basil"], instructions: ["Cook pasta.", "Make the sauce.", "Combine and serve."], mealType: "Dinner", trending: true, favorite: true, cuisine: "Italian" },
  { id: 8, title: "Greek Yogurt Parfait", description: "A healthy and quick breakfast option.", mood: "Bored", time: 5, diet: "Vegetarian", image: "https://placehold.co/600x400/fde047/ffffff?text=Parfait", ingredients: ["Greek Yogurt", "Granola", "Berries", "Honey"], instructions: ["Layer yogurt, granola, and berries in a glass.", "Drizzle with honey.", "Serve immediately."], mealType: "Breakfast", trending: false, favorite: true, cuisine: "American" },
  { id: 9, title: "Beef and Broccoli", description: "A classic takeout dish made at home.", mood: "Stressed", time: 30, diet: "High-Protein", image: "https://placehold.co/600x400/7c3aed/ffffff?text=Beef+Broccoli", ingredients: ["Beef", "Broccoli", "Soy Sauce", "Ginger", "Garlic", "Rice"], instructions: ["Slice beef thinly.", "Stir-fry beef until browned.", "Add broccoli and sauce, then simmer."], mealType: "Dinner", trending: true, favorite: false, cuisine: "Asian" },
  { id: 10, title: "Caprese Sandwich", description: "A simple and elegant lunch.", mood: "Happy", time: 10, diet: "Vegetarian", image: "https://placehold.co/600x400/ef4444/ffffff?text=Caprese", ingredients: ["Baguette", "Tomatoes", "Mozzarella", "Basil", "Balsamic Glaze"], instructions: ["Slice baguette, tomatoes, and mozzarella.", "Layer ingredients on the bread.", "Drizzle with balsamic glaze."], mealType: "Lunch", trending: false, favorite: false, cuisine: "Italian" },
  { id: 11, title: "Energizing Smoothie", description: "A green smoothie to kickstart your day.", mood: "Tired", time: 5, diet: "Vegan", image: "https://placehold.co/600x400/22c55e/ffffff?text=Smoothie", ingredients: ["Spinach", "Banana", "Almond Milk", "Protein Powder"], instructions: ["Combine all ingredients in a blender.", "Blend until smooth.", "Enjoy immediately."], mealType: "Breakfast", trending: true, favorite: false, cuisine: "American" },
  { id: 12, title: "Sheet Pan Lemon Herb Chicken", description: "An easy one-pan dinner.", mood: "Tired", time: 45, diet: "High-Protein", image: "https://placehold.co/600x400/f97316/ffffff?text=Sheet+Pan+Chicken", ingredients: ["Chicken", "Potatoes", "Green Beans", "Lemon", "Herbs", "Vegetables"], instructions: ["Toss all ingredients with olive oil and herbs.", "Arrange on a sheet pan.", "Bake at 400°F (200°C) for 30-35 minutes."], mealType: "Dinner", trending: false, favorite: true, cuisine: "American" },
]);

// --- User Preferences State ---
const preferences = ref({
  isVegetarian: localStorage.getItem('isVegetarian') === 'true',
  isVegan: localStorage.getItem('isVegan') === 'true',
  isHalal: localStorage.getItem('isHalal') === 'true',
  hasNutAllergy: localStorage.getItem('hasNutAllergy') === 'true',
  isGlutenFree: localStorage.getItem('isGlutenFree') === 'true',
  hasDairyAllergy: localStorage.getItem('hasDairyAllergy') === 'true',
  hasEggAllergy: localStorage.getItem('hasEggAllergy') === 'true',
  hasFishAllergy: localStorage.getItem('hasFishAllergy') === 'true',
  hasShellfishAllergy: localStorage.getItem('hasShellfishAllergy') === 'true',
});

// Watch for changes and save to localStorage
watch(preferences, (newPrefs) => {
  for (const key in newPrefs) {
    localStorage.setItem(key, newPrefs[key as keyof typeof newPrefs].toString());
  }
}, { deep: true });


// This is the composable function
export function useRecipes() {

  const toggleFavorite = (recipeId: number) => {
    const recipe = mockRecipes.value.find(r => r.id === recipeId);
    if (recipe) {
      recipe.favorite = !recipe.favorite;
    }
  };

  const favoriteRecipes = computed(() => mockRecipes.value.filter(r => r.favorite));

  return {
    // State
    mockRecipes,
    preferences,
    
    // Computed
    favoriteRecipes,

    // Methods
    toggleFavorite,
  };
}