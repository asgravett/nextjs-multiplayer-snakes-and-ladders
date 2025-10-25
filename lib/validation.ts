import { z } from 'zod';

export const moveSchema = z.object({
  roll: z.number().int().min(1).max(6),
});

export type Move = z.infer<typeof moveSchema>;
