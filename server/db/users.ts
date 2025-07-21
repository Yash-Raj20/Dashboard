import { User, Role, ROLE_PERMISSIONS } from '@shared/auth';
import { hashPassword } from '../utils/password';

// In-memory database simulation
// In production, replace this with a real database
export const users: (User & { password: string })[] = [];

// Initialize with a default main admin
export async function initializeDefaultAdmin() {
  if (users.length === 0) {
    const defaultAdmin = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Main Administrator',
      password: await hashPassword('Admin123!'),
      role: 'main-admin' as Role,
      permissions: ROLE_PERMISSIONS['main-admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLogin: undefined,
      createdBy: undefined
    };
    
    users.push(defaultAdmin);
    console.log('Default admin created with email: admin@example.com and password: Admin123!');
  }
}

export function findUserByEmail(email: string): (User & { password: string }) | undefined {
  return users.find(user => user.email === email);
}

export function findUserById(id: string): (User & { password: string }) | undefined {
  return users.find(user => user.id === id);
}

export function getAllUsers(): User[] {
  return users.map(({ password, ...user }) => user);
}

export function getSubAdmins(): User[] {
  return users
    .filter(user => user.role === 'sub-admin')
    .map(({ password, ...user }) => user);
}

export function createUser(userData: Omit<User & { password: string }, 'id' | 'createdAt' | 'updatedAt'>): User {
  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.push(newUser);
  
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

export function deleteUser(id: string): boolean {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return false;
  
  users.splice(userIndex, 1);
  return true;
}

export function updateLastLogin(id: string): void {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex !== -1) {
    users[userIndex].lastLogin = new Date();
    users[userIndex].updatedAt = new Date();
  }
}
