import { useCallback, useRef, useEffect, useState } from 'react';
import { TierList } from '../types';
import { tierListApi, categoryApi, itemApi } from '../api/endpoints';

export type MutationType =
  | 'CREATE_TIERLIST'
  | 'UPDATE_TIERLIST'
  | 'DELETE_TIERLIST'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'REORDER_CATEGORIES'
  | 'CREATE_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'REORDER_ITEMS'
  | 'MOVE_ITEM';

export interface Mutation {
  id: string;
  type: MutationType;
  payload: unknown;
  tierListId: string;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const SYNC_DEBOUNCE = 500;

export const useTierListSync = () => {
  const [queue, setQueue] = useState<Mutation[]>([]);
  const [processing, setProcessing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const addToQueue = useCallback((mutation: Omit<Mutation, 'id' | 'timestamp' | 'retries'>) => {
    const newMutation: Mutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue((prev) => [...prev, newMutation]);
    triggerSync();
  }, []);

  const triggerSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processQueue();
    }, SYNC_DEBOUNCE);
  }, []);

  const processQueue = useCallback(async () => {
    if (processing || queue.length === 0) return;

    setProcessing(true);
    setSyncError(null);

    const mutationsToProcess = [...queue];

    for (const mutation of mutationsToProcess) {
      if (!isMountedRef.current) break;

      try {
        await executeMutation(mutation);
        setQueue((prev) => prev.filter((m) => m.id !== mutation.id));
      } catch (error) {
        console.error('Sync failed for mutation:', mutation, error);

        if (mutation.retries < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, mutation.retries);
          await new Promise((resolve) => setTimeout(resolve, delay));

          setQueue((prev) =>
            prev.map((m) =>
              m.id === mutation.id ? { ...m, retries: m.retries + 1 } : m
            )
          );
        } else {
          setQueue((prev) => prev.filter((m) => m.id !== mutation.id));
          setSyncError(`Falha ao sincronizar: ${mutation.type}. Tente novamente.`);
        }
      }
    }

    setProcessing(false);
  }, [queue, processing]);

  const executeMutation = async (mutation: Mutation): Promise<void> => {
    const { type, payload, tierListId } = mutation;

    switch (type) {
      case 'CREATE_TIERLIST': {
        await tierListApi.create(payload as Parameters<typeof tierListApi.create>[0]);
        break;
      }
      case 'UPDATE_TIERLIST': {
        const { id, data } = payload as { id: string; data: Parameters<typeof tierListApi.update>[1] };
        await tierListApi.update(id, data);
        break;
      }
      case 'DELETE_TIERLIST': {
        await tierListApi.delete(tierListId);
        break;
      }
      case 'CREATE_CATEGORY': {
        await categoryApi.create(tierListId, payload as Parameters<typeof categoryApi.create>[1]);
        break;
      }
      case 'UPDATE_CATEGORY': {
        const { id, data } = payload as { id: string; data: Parameters<typeof categoryApi.update>[1] };
        await categoryApi.update(id, data);
        break;
      }
      case 'DELETE_CATEGORY': {
        await categoryApi.delete(payload as string);
        break;
      }
      case 'REORDER_CATEGORIES': {
        await tierListApi.reorderCategories(tierListId, payload as string[]);
        break;
      }
      case 'CREATE_ITEM': {
        await itemApi.create(tierListId, payload as Parameters<typeof itemApi.create>[1]);
        break;
      }
      case 'UPDATE_ITEM': {
        const { id, data } = payload as { id: string; data: Parameters<typeof itemApi.update>[1] };
        await itemApi.update(id, data);
        break;
      }
      case 'DELETE_ITEM': {
        await itemApi.delete(payload as string);
        break;
      }
      case 'REORDER_ITEMS':
      case 'MOVE_ITEM': {
        await itemApi.reorder(tierListId, payload as Parameters<typeof itemApi.reorder>[1]);
        break;
      }
    }
  };

  const loadTierList = useCallback(async (id: string): Promise<TierList | null> => {
    try {
      const response = await tierListApi.get(id);
      return response.data;
    } catch {
      return null;
    }
  }, []);

  const createTierList = useCallback(async (data: Parameters<typeof tierListApi.create>[0]): Promise<TierList> => {
    const response = await tierListApi.create(data);
    return response.data;
  }, []);

  const forceSync = useCallback(() => {
    processQueue();
  }, [processQueue]);

  return {
    queue,
    processing,
    syncError,
    addToQueue,
    loadTierList,
    createTierList,
    forceSync,
  };
};