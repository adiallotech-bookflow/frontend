import { User } from './user.model';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}