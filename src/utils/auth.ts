export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const DEFAULT_PASS_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // hash of "admin"
