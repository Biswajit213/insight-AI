import { z } from 'zod';

export const updateDatasetSchema = z.object({
  name: z.string().min(1).max(150).optional(),
});
