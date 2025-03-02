export const LEVEL_COLORS = [
  "bg-gradient-to-r from-blue-400 to-blue-500", // Level 1
  "bg-gradient-to-r from-green-400 to-green-500", // Level 2
  "bg-gradient-to-r from-yellow-400 to-yellow-500", // Level 3
  "bg-gradient-to-r from-orange-400 to-orange-500", // Level 4
  "bg-gradient-to-r from-red-400 to-red-500", // Level 5
  "bg-gradient-to-r from-purple-400 to-purple-500", // Level 6
  "bg-gradient-to-r from-pink-400 to-pink-500", // Level 7
  "bg-gradient-to-r from-indigo-400 to-indigo-500", // Level 8
  "bg-gradient-to-r from-cyan-400 to-cyan-500", // Level 9
  "bg-gradient-to-r from-rose-400 to-rose-500", // Level 10
];

export const LEVEL_THRESHOLDS = [
  0, // Level 1: 0-999
  1000, // Level 2: 1000-1999
  2000, // Level 3: 2000-2999
  3000, // Level 4: 3000-3999
  4000, // Level 5: 4000-4999
  5000, // Level 6: 5000-5999
  6000, // Level 7: 6000-6999
  7000, // Level 8: 7000-7999
  8000, // Level 9: 8000-8999
  9000, // Level 10: 9000-10000
  10000, // Max points
];

export function calculateLevelInfo(points: number) {
  // Find the level based on points
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  // Calculate progress percentage to next level
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextLevelThreshold = LEVEL_THRESHOLDS[level];
  const pointsInCurrentLevel = points - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    level,
    progress: Math.min(progress, 100),
    pointsToNextLevel: nextLevelThreshold - points,
  };
}
