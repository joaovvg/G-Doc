// import { SupabaseConfig } from '../types';
import { ExternalPortalPreparation, ExternalPortalProcessDetail, ExternalPortalSession, PortalService } from '../types';

const API_BASE = ((import.meta as any)?.env?.VITE_API_URL || '').replace(/\/$/, '');
const DB_PREFIX = 'GDOC_API_CACHE_';

const safeStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch (error) { console.error('Falha ao gravar cache local', error); }
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); } catch {}
  },
  getAllKeys: () => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch {
      return [];
    }
  }
};

const buildUrl = (path: string) => `${API_BASE}${path}`;

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Falha na comunicação com a API.');
  }

  return payload as T;
};

export class DatabaseService {
  /*
  static getSupabaseConfig(): SupabaseConfig {
    return { url: API_BASE || '/api', anonKey: 'backend-api', enabled: true };
  }
  */

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const payload = await fetchJson<{ success: boolean; message: string }>('/api/health');
      return { success: true, message: payload.message || 'Conectado ao PostgreSQL' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Falha ao conectar na API' };
    }
  }

  static async getAll<T>(tableName: string, defaultValue: T): Promise<T> {
    try {
      const payload = await fetchJson<{ success: boolean; data: T }>(`/api/${tableName}`);
      safeStorage.setItem(DB_PREFIX + tableName, JSON.stringify(payload.data));
      return payload.data;
    } catch (error) {
      console.warn(`Falha ao carregar ${tableName} da API. Usando cache local.`, error);
      const cached = safeStorage.getItem(DB_PREFIX + tableName);
      return cached ? JSON.parse(cached) : defaultValue;
    }
  }

  static async saveLocal<T>(tableName: string, data: T): Promise<void> {
    safeStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
  }

  static async upsert(tableName: string, item: any): Promise<void> {
    await fetchJson(`/api/${tableName}/upsert`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async syncAll(): Promise<void> {
    return;
  }

  static async delete(tableName: string, id: string): Promise<void> {
    const localData = safeStorage.getItem(DB_PREFIX + tableName);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          safeStorage.setItem(
            DB_PREFIX + tableName,
            JSON.stringify(parsed.filter((item: any) => item.id !== id))
          );
        }
      } catch {}
    }

    await fetchJson(`/api/${tableName}/${id}`, { method: 'DELETE' });
  }

  static clearLocalCache() {
    const keysToRemove = safeStorage.getAllKeys().filter((key) => key.startsWith(DB_PREFIX));
    keysToRemove.forEach((key) => safeStorage.removeItem(key));
    window.location.reload();
  }

  static async externalPortalPrepareAccess(identifier: string): Promise<ExternalPortalPreparation> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalPreparation }>('/api/external-portal/prepare-access', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
    return payload.data;
  }

  static async externalPortalSetPassword(identifier: string, password: string): Promise<ExternalPortalPreparation> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalPreparation }>('/api/external-portal/set-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    return payload.data;
  }

  static async externalPortalRegister(identifier: string, name: string, email: string, password: string): Promise<ExternalPortalPreparation> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalPreparation }>('/api/external-portal/register', {
      method: 'POST',
      body: JSON.stringify({ identifier, name, email, password }),
    });
    return payload.data;
  }

  static async externalPortalLogin(identifier: string, password: string): Promise<ExternalPortalSession> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalSession }>('/api/external-portal/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    return payload.data;
  }

  static async externalPortalProcessDetail(identifier: string, processId: string): Promise<ExternalPortalProcessDetail> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalProcessDetail }>('/api/external-portal/process-detail', {
      method: 'POST',
      body: JSON.stringify({ identifier, processId }),
    });
    return payload.data;
  }

  static async externalPortalSubmitRequest(
    identifier: string,
    serviceId: string,
    details: string,
    attachments: { name: string; content: string; fieldLabel?: string }[] = []
  ): Promise<ExternalPortalSession> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalSession }>('/api/external-portal/submit-request', {
      method: 'POST',
      body: JSON.stringify({ identifier, serviceId, details, attachments }),
    });
    return payload.data;
  }

  static async externalPortalSubmitPendingResponse(
    identifier: string,
    processId: string,
    payloadData: { responseText?: string; attachment?: { name: string; content: string } } = {}
  ): Promise<ExternalPortalProcessDetail> {
    const payload = await fetchJson<{ success: boolean; data: ExternalPortalProcessDetail }>('/api/external-portal/process-response', {
      method: 'POST',
      body: JSON.stringify({ identifier, processId, ...payloadData }),
    });
    return payload.data;
  }
}
