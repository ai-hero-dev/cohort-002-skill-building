import {
  accessSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

export namespace DB {
  // Types for our persistence layer
  export interface MemoryItem {
    id: string;
    memory: string;
    createdAt: string;
  }

  export interface PersistenceData {
    memories: DB.MemoryItem[];
  }
}

// File path for storing the data
const DATA_FILE_PATH = join(
  process.cwd(),
  'data',
  'memories.local.json',
);

export const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = join(process.cwd(), 'data');
  try {
    accessSync(dataDir);
  } catch {
    mkdirSync(dataDir, { recursive: true });
  }
}

function loadDB(): DB.PersistenceData {
  try {
    ensureDataDirectory();
    const data = readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data) as DB.PersistenceData;
  } catch (error) {
    return { memories: [] };
  }
}

/**
 * Load all chats from the JSON file
 */
export function loadMemories(): DB.MemoryItem[] {
  try {
    ensureDataDirectory();
    const data = readFileSync(DATA_FILE_PATH, 'utf-8');
    const parsed: DB.PersistenceData = JSON.parse(data);
    return parsed.memories || [];
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Save all chats to the JSON file
 */
export function saveMemories(memories: DB.MemoryItem[]): void {
  const data = loadDB();
  data.memories = [...data.memories, ...memories];

  writeFileSync(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );
}

export function updateMemory(
  memoryId: string,
  memory: Omit<DB.MemoryItem, 'id'>,
): boolean {
  const data = loadDB();
  data.memories = data.memories.map((m) =>
    m.id === memoryId ? { ...m, ...memory } : m,
  );

  writeFileSync(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );

  return true;
}

export function deleteMemory(memoryId: string): boolean {
  const data = loadDB();
  data.memories = data.memories.filter((m) => m.id !== memoryId);

  writeFileSync(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );

  return true;
}
