import { createResendCooldown } from './resend-cooldown';

const cooldown = createResendCooldown('tripready:recovery-last-sent');

export const getRecoveryCooldownSeconds = cooldown.getSecondsRemaining;
export const markRecoverySent = cooldown.markSent;
