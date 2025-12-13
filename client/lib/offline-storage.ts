import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "cache_";
const PENDING_ACTIONS_KEY = "pending_offline_actions";
const LAST_SYNC_KEY = "last_sync_timestamp";

export interface PendingAction {
  id: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  body?: any;
  timestamp: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  duration: number = DEFAULT_CACHE_DURATION
): Promise<void> {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error("Error writing cache:", error);
  }
}

export async function clearCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const pending = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error("Error reading pending actions:", error);
    return [];
  }
}

export async function addPendingAction(action: Omit<PendingAction, "id" | "timestamp">): Promise<void> {
  try {
    const pending = await getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    pending.push(newAction);
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error("Error adding pending action:", error);
  }
}

export async function removePendingAction(actionId: string): Promise<void> {
  try {
    const pending = await getPendingActions();
    const filtered = pending.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing pending action:", error);
  }
}

export async function clearPendingActions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
  } catch (error) {
    console.error("Error clearing pending actions:", error);
  }
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error("Error reading last sync time:", error);
    return null;
  }
}

export async function setLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error setting last sync time:", error);
  }
}

export function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return "Never";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
