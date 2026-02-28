import type { PasswordValidation } from '../types';

export function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

export function isPasswordValid(v: PasswordValidation): boolean {
  return v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecialChar;
}
