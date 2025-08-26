import { Role } from "./role.model";

export interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  photoProfil?: string;
  deviceToken?: string;
  roles: Role[];
  actif: boolean;
}

export interface UserRegistration {
  username: string;
  name: string;
  phone: string;
  password: string;
  photoProfil?: string;
  roleName: string; 
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface GoogleOAuthResponse {
  success: boolean;
  token: string;
  message: string;
  user?: {
    id: any;
    username: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export type { Role };