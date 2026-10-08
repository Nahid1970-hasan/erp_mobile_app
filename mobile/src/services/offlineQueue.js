import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErpApi } from './api';

const KEY = 'production_queue';

export async function queuedEntries() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

async function saveQueue(items) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueueEntry(body) {
  const items = await queuedEntries();
  items.push(body);
  await saveQueue(items);
  return items.length;
}

export async function flushQueue() {
  const items = await queuedEntries();
  const remain = [];
  let sent = 0;
  for (const item of items) {
    try {
      await ErpApi.createEntry(item);
      sent += 1;
    } catch (error) {
      if (!error.response) remain.push(item);
    }
  }
  await saveQueue(remain);
  return { sent, left: remain.length };
}
