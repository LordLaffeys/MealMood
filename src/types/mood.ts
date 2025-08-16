// types/mood.ts
export interface MoodLog {
  id: string;
  mood: string;
  recipeId: string;
  timestamp: Date;
  userId: string;
}

export interface WeeklyMoodSummary {
  totalLogs: number;
  mostCommonMood: string | null;
  moodCounts: Record<string, number>;
}

export interface MoodChartData {
  labels: string[];
  datasets: Array<{
    type: string;
    label: string;
    backgroundColor?: string;
    borderColor?: string;
    data: number[];
    stack?: string;
    order: number;
    yAxisID?: string;
    tension?: number;
    borderWidth?: number;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointBorderWidth?: number;
    pointRadius?: number;
  }>;
}

export type MoodType = 'Happy' | 'Sad' | 'Angry' | 'Tired' | 'Stressed' | 'Bored';

export interface DailyMoodStats {
  date: Date;
  moodCounts: Record<MoodType, number>;
  healthScore: number;
  totalLogs: number;
}