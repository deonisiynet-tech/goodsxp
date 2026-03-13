// Server Actions are deprecated in this project
// All API calls should go through Express API endpoints

// Placeholder functions - should not be used
export async function getSettings(): Promise<Record<string, any>> {
  throw new Error('Deprecated: Use fetch API instead')
}

export async function updateSettings(_settings: Record<string, any>): Promise<void> {
  throw new Error('Deprecated: Use fetch API instead')
}
