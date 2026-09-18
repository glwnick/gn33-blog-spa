import { z } from 'zod';

// publicKey is null when the backend has no VAPID keypair configured (the "feature off" state the backend
// treats as a clean no-op); the frontend reads that null to hide the opt-in rather than offer a button that
// would fail on subscribe.
export const pushPublicKeySchema = z.object({
  publicKey: z.string().nullable(),
});

export type PushPublicKey = z.infer<typeof pushPublicKeySchema>;

export const pushSubscriptionRequestSchema = z.object({
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().nullable(),
});

export type PushSubscriptionRequest = z.infer<
  typeof pushSubscriptionRequestSchema
>;
