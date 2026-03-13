// Server Actions are deprecated in this project
// All API calls should go through Express API endpoints

export interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

// Placeholder functions - should not be used
export async function getUsers(): Promise<User[]> {
  throw new Error('Deprecated: Use fetch API instead')
}

export async function updateUserRole(_id: string, _role: string): Promise<User> {
  throw new Error('Deprecated: Use fetch API instead')
}
