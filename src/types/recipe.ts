// types/recipe.ts
export interface Recipe {
  id: number;
  title: string;
  description: string;
  mood: string;
  time: string;
  diet: string[];
  image: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  cuisine: {
    Javanese: boolean;
    Padang: boolean;
    Sundanese: boolean;
    Nusantara: boolean;
    ComfortFood: boolean;
    Japanese: boolean;
    SpicyFood: boolean;
    StreetFood: boolean;
    ChineseIndonesian: boolean;
  };
  allergyWarning: {
    isNutAllergy: boolean;
    isDairyAllergy: boolean;
    isEggAllergy: boolean;
    isFishAllergy: boolean;
    isShellfishAllergy: boolean;
  };
  favorite?: boolean;
  trending?: boolean;
}

export interface UserPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHalal: boolean;
  isLactoseIntolerant: boolean;
  cuisines: {
    Javanese: boolean;
    Padang: boolean;
    Sundanese: boolean;
    ChineseIndonesian: boolean;
    ComfortFood: boolean;
    Japanese: boolean;
    SpicyFood: boolean;
    StreetFood: boolean;
    Nusantara: boolean;
  };
}

export interface UserAllergies {
  isNutAllergy: boolean;
  isDairyAllergy: boolean;
  isEggAllergy: boolean;
  isFishAllergy: boolean;
  isShellfishAllergy: boolean;
}