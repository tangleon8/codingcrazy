/**
 * Shared types and schemas for CodingCrazy
 */

import { z } from 'zod';

// Level JSON schema for validation
export const LevelJsonSchema = z.object({
  gridWidth: z.number().int().min(3).max(20),
  gridHeight: z.number().int().min(3).max(20),
  startPosition: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
  goals: z.array(
    z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    })
  ).min(1),
  walls: z.array(
    z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    })
  ).default([]),
  coins: z.array(
    z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
    })
  ).default([]),
  hazards: z.array(
    z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      pattern: z.enum(['toggle', 'static']),
      activeFrames: z.array(z.number().int().min(0)),
      type: z.enum(['spike', 'fire']),
    })
  ).default([]),
  allowedMethods: z.array(z.enum(['move', 'wait'])).default(['move']),
  instructions: z.string().min(1),
  starterCode: z.string(),
  winConditions: z.object({
    reachGoal: z.boolean(),
    collectAllCoins: z.boolean(),
  }),
});

export type LevelJson = z.infer<typeof LevelJsonSchema>;

// Validate level JSON
export function validateLevelJson(data: unknown): { valid: boolean; errors?: string[] } {
  const result = LevelJsonSchema.safeParse(data);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
