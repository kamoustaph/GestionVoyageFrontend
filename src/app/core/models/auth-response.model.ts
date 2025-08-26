export interface AuthResponse {
  token: string;
  user?: {
    id: any;
    username: string;
    name: string;
    roles: string[];
  };
}