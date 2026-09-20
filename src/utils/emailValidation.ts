/**
 * Strict format validation for email addresses.
 *
 * Requirements:
 * - NO email OTP verification / mailbox check
 * - Non-empty local part before @
 * - Exactly one @ separator
 * - Valid domain with dot structure (at least two domain parts, valid TLD)
 * - Valid characters, no whitespace, no consecutive @, no consecutive dots
 * - Supports custom domains (e.g. user@company.in, user@startup.tech, user@cumail.in)
 * - Does NOT restrict to famous providers
 */
export const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (trimmed !== email) return false; // Contains leading/trailing whitespace
  if (/\s/.test(email)) return false; // Contains whitespace anywhere

  // Must have exactly one '@'
  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;

  // Validate local part
  if (!localPart || localPart.length === 0 || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;

  const localPartRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localPartRegex.test(localPart)) return false;

  // Validate domain part
  if (!domainPart || domainPart.length === 0 || domainPart.length > 255) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.startsWith('-') || domainPart.endsWith('-')) return false;
  if (domainPart.includes('..')) return false;

  // Must have at least one dot separating domain and TLD (e.g. "gmail.com", "startup.tech")
  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) return false;

  for (const label of domainLabels) {
    if (!label || label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
  }

  // TLD must be at least 2 alphabetic characters (e.g. "com", "in", "org", "tech", "edu")
  const tld = domainLabels[domainLabels.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,}$/.test(tld)) return false;

  return true;
};
