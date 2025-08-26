export enum RoleType {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  USER = 'USER'
}

export interface Role {
  id: number;
  name: RoleType;
}