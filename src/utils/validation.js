export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6; // the minimum enforced by Firebase Authentication

/** Validates the sign-up form. Returns an object of field → message (empty when everything is fine). */
export function validateSignup({ email, password, confirm }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Choose a password.';
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!confirm) errors.confirm = 'Repeat the password.';
  else if (confirm !== password) errors.confirm = 'The passwords do not match.';
  return errors;
}
