import { invoke } from '@tauri-apps/api/core';
import { mockInvoke } from '@/backend/mockBackend';

function hasTauriRuntime() {
  return typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__ !== 'undefined';
}

export function shouldUseMockBackend() {
  if (import.meta.env.MODE === 'test') {
    return false;
  }

  if (import.meta.env.VITE_ENABLE_MOCK_BACKEND === 'true') {
    return true;
  }

  if (import.meta.env.VITE_ENABLE_MOCK_BACKEND === 'false') {
    return false;
  }

  return import.meta.env.DEV && !hasTauriRuntime();
}

export async function invokeBackend<T>(command: string, args?: Record<string, unknown>) {
  if (shouldUseMockBackend()) {
    return mockInvoke<T>(command, args);
  }

  return invoke<T>(command, args);
}
