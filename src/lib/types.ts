export interface Task {
  id: string;
  user_id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic' | string;
  points: number;
  category: 'Fitness' | 'Code' | 'Learning' | 'Life' | string;
  created_at: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  color: 'cyan' | 'pink';
  points: number;
  streak: number;
}

export function getRank(points: number): string {
  if (points < 1000) return 'BEGINNER';
  if (points < 2500) return 'WARRIOR';
  if (points < 5000) return 'ELITE';
  if (points < 10000) return 'MONSTER';
  return 'LEGEND';
}

export function getLevelNumber(points: number): number {
  return Math.floor(points / 250) + 1; // 1 level per 250 xp
}

export function getProgressToNextLevel(points: number): number {
  return (points % 250) / 250;
}
