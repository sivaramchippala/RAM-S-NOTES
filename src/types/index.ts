export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  type: 'folder' | 'file';
  children: FolderItem[];
  content?: string;
  createdAt: number;
  updatedAt: number;
  isExpanded?: boolean;
}

export type AuthView =
  | 'signin'
  | 'signup'
  | 'email-verification'
  | 'forgot-password'
  | 'forgot-password-code'
  | 'new-password';

export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
