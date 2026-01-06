// Level 2 Quest Definitions - Crystal Cave
// Coordinates are for a ~1100x600 fixed map area

import { Quest } from './level1Quests';

export const LEVEL_2_QUESTS: Quest[] = [
  {
    id: 11,
    slug: 'crystal-entrance',
    title: 'Crystal Entrance',
    description: 'Enter the mysterious Crystal Cavern. Navigate through glowing crystals to find your way.',
    difficulty: 'medium',
    xpReward: 150,
    coinReward: 50,
    x: 12,
    y: 70,
  },
  {
    id: 12,
    slug: 'key-to-progress',
    title: 'Key to Progress',
    description: 'A gate blocks your path! Find the key to unlock new areas of the cave.',
    difficulty: 'medium',
    xpReward: 180,
    coinReward: 60,
    x: 50,
    y: 45,
  },
  {
    id: 13,
    slug: 'cavern-depths',
    title: 'Cavern Depths',
    description: 'Venture deep into the cavern. Avoid the snail guardian and escape with the treasure!',
    difficulty: 'hard',
    xpReward: 250,
    coinReward: 80,
    x: 88,
    y: 25,
  },
];

// Get connections between Level 2 quests (linear chain)
export function getLevel2Connections(): [number, number][] {
  const connections: [number, number][] = [];
  for (let i = 0; i < LEVEL_2_QUESTS.length - 1; i++) {
    connections.push([LEVEL_2_QUESTS[i].id, LEVEL_2_QUESTS[i + 1].id]);
  }
  return connections;
}
