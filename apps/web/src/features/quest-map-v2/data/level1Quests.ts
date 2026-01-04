// Level 1 Quest Definitions
// Coordinates are for a ~1100x600 fixed map area

export interface Quest {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  coinReward: number;
  x: number; // percentage (0-100) for responsive positioning
  y: number; // percentage (0-100) for responsive positioning
}

export const LEVEL_1_QUESTS: Quest[] = [
  {
    id: 1,
    slug: 'first-steps',
    title: 'First Steps',
    description: 'Learn the basics of movement. Guide your hero to the goal using simple commands.',
    difficulty: 'easy',
    xpReward: 50,
    coinReward: 10,
    x: 8,
    y: 75,
  },
  {
    id: 2,
    slug: 'moving-forward',
    title: 'Moving Forward',
    description: 'Practice moving in different directions. Master the art of navigation!',
    difficulty: 'easy',
    xpReward: 60,
    coinReward: 15,
    x: 18,
    y: 58,
  },
  {
    id: 3,
    slug: 'turn-around',
    title: 'Turn Around',
    description: 'Learn to turn and change direction. Navigate through corners with ease.',
    difficulty: 'easy',
    xpReward: 70,
    coinReward: 20,
    x: 30,
    y: 45,
  },
  {
    id: 4,
    slug: 'collect-coins',
    title: 'Collect Coins',
    description: 'Gather shiny coins along the way! Every coin counts towards your treasure.',
    difficulty: 'easy',
    xpReward: 80,
    coinReward: 30,
    x: 42,
    y: 35,
  },
  {
    id: 5,
    slug: 'avoid-traps',
    title: 'Avoid Traps',
    description: 'Watch out for hazards! Plan your path carefully to avoid danger.',
    difficulty: 'medium',
    xpReward: 100,
    coinReward: 35,
    x: 54,
    y: 28,
  },
  {
    id: 6,
    slug: 'loop-practice',
    title: 'Loop Practice',
    description: 'Repeat actions efficiently using loops. Less code, more power!',
    difficulty: 'medium',
    xpReward: 120,
    coinReward: 40,
    x: 66,
    y: 22,
  },
  {
    id: 7,
    slug: 'complex-path',
    title: 'Complex Path',
    description: 'Navigate through a winding maze. Think ahead and plan your route!',
    difficulty: 'medium',
    xpReward: 140,
    coinReward: 45,
    x: 78,
    y: 32,
  },
  {
    id: 8,
    slug: 'speed-run',
    title: 'Speed Run',
    description: 'Complete the challenge as fast as possible. Efficiency is key!',
    difficulty: 'medium',
    xpReward: 160,
    coinReward: 50,
    x: 86,
    y: 45,
  },
  {
    id: 9,
    slug: 'final-challenge',
    title: 'Final Challenge',
    description: 'Put all your skills to the test in this challenging level.',
    difficulty: 'hard',
    xpReward: 200,
    coinReward: 60,
    x: 92,
    y: 60,
  },
  {
    id: 10,
    slug: 'level-1-boss',
    title: 'Level 1 Boss',
    description: 'Face the ultimate challenge of Level 1. Prove your mastery!',
    difficulty: 'hard',
    xpReward: 300,
    coinReward: 100,
    x: 95,
    y: 78,
  },
];

// Get connections between quests (linear chain for Level 1)
export function getQuestConnections(): [number, number][] {
  const connections: [number, number][] = [];
  for (let i = 0; i < LEVEL_1_QUESTS.length - 1; i++) {
    connections.push([LEVEL_1_QUESTS[i].id, LEVEL_1_QUESTS[i + 1].id]);
  }
  return connections;
}
