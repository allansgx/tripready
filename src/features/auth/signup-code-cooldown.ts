import { createResendCooldown } from './resend-cooldown';

const cooldown = createResendCooldown('tripready:signup-code-last-sent');

export const getSignupCodeCooldownSeconds = cooldown.getSecondsRemaining;
export const markSignupCodeSent = cooldown.markSent;
