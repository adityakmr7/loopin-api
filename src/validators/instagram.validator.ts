import { z } from 'zod';

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export const accountIdSchema = z.object({
  accountId: z.string().cuid('Invalid account ID'),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type AccountIdInput = z.infer<typeof accountIdSchema>;
