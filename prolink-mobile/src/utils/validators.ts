/**
 * Validate an email address.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate a password (minimum 8 characters, at least one letter and one number).
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validate a Nigerian phone number.
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+234|234|0)[789][01]\d{8}$/.test(cleaned);
}

/**
 * Validate a Nigerian bank account number (10 digits).
 */
export function isValidAccountNumber(num: string): boolean {
  return /^\d{10}$/.test(num);
}

/**
 * Get password strength indicator (0-4).
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
}

/**
 * Validate that a string is not empty after trimming.
 */
export function isRequired(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
