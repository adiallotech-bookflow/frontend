export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'admin' | 'professional' | 'customer';
  createdAt: Date;
  updatedAt: Date;
}