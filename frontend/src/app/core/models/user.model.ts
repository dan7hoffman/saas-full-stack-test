export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // USER, ADMIN, SUPER_ADMIN
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}
