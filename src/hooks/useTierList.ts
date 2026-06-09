import { useState, useCallback, useEffect } from "react";
import { TierList, Category, TierItem, ActivityLog, User } from "../types";
import { generateId, formatDate } from "../utils/storage";
import { useTierListSync, MutationType } from "./useTierListSync";

const POOL_ID = "__POOL__";

export const useTierList = (
  initialTierList: TierList,
  currentUser: User | null,
) => {
  const [tierList, setTierList] = useState<TierList>(initialTierList);
  const [isLoading, setIsLoading] = useState(false);

  const {
    queue,
    processing,
    syncError,
    addToQueue,
    loadTierList,
    createTierList: createTierListAPI,
  } = useTierListSync();

  // Carrega do backend se tiver ID válido (não fallback)
  useEffect(() => {
    if (initialTierList.id !== "fallback" && initialTierList.id) {
      const load = async () => {
        setIsLoading(true);
        const loaded = await loadTierList(initialTierList.id);
        if (loaded) {
          setTierList(loaded);
        }
        setIsLoading(false);
      };
      load();
    }
  }, [initialTierList.id, loadTierList]);

  // Helper: adiciona activity local + queue para sync
  const addActivity = useCallback(
    (action: string, userName: string, userId: string) => {
      const now = new Date().toISOString();
      const activity: ActivityLog = {
        id: generateId(),
        userId,
        userName,
        action,
        timestamp: now,
      };

      setTierList((prev) => ({
        ...prev,
        activities: [activity, ...prev.activities].slice(0, 100),
        updatedAt: now,
      }));

      // Queue para sync (activities são salvas junto com a mutação principal no backend)
    },
    [],
  );

  // --- CATEGORIES ---

  const addCategory = useCallback(
    (name: string, color: string, userName: string, userId: string) => {
      const newCategory: Category = {
        id: generateId(),
        name,
        color,
        order: tierList.categories.length,
      };

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory],
        updatedAt: now,
      }));

      addActivity(`adicionou categoria "${name}"`, userName, userId);

      addToQueue({
        type: "CREATE_CATEGORY" as MutationType,
        payload: { name, color },
        tierListId: tierList.id,
      });
    },
    [tierList.categories.length, tierList.id, addActivity, addToQueue],
  );

  const removeCategory = useCallback(
    (categoryId: string, userName: string, userId: string) => {
      const category = tierList.categories.find((c) => c.id === categoryId);

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== categoryId),
        items: prev.items.filter((item) => item.categoryId !== categoryId),
        updatedAt: now,
      }));

      if (category) {
        addActivity(`removeu categoria "${category.name}"`, userName, userId);
      }

      addToQueue({
        type: "DELETE_CATEGORY" as MutationType,
        payload: categoryId,
        tierListId: tierList.id,
      });
    },
    [tierList.categories, tierList.id, addActivity, addToQueue],
  );

  const updateCategory = useCallback(
    (
      categoryId: string,
      updates: Partial<Category>,
      userName: string,
      userId: string,
    ) => {
      const oldCategory = tierList.categories.find((c) => c.id === categoryId);

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c,
        ),
        updatedAt: now,
      }));

      if (oldCategory && updates.name && updates.name !== oldCategory.name) {
        addActivity(
          `renomeou categoria de "${oldCategory.name}" para "${updates.name}"`,
          userName,
          userId,
        );
      }

      addToQueue({
        type: "UPDATE_CATEGORY" as MutationType,
        payload: { id: categoryId, data: updates },
        tierListId: tierList.id,
      });
    },
    [tierList.categories, tierList.id, addActivity, addToQueue],
  );

  // --- ITEMS ---

  const addItem = useCallback(
    (
      name: string,
      categoryId: string,
      image?: string,
      userName?: string,
      userId?: string,
    ) => {
      const newItem: TierItem = {
        id: generateId(),
        name,
        categoryId,
        imageUrl: image,
      };

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
        updatedAt: now,
      }));

      if (userName && userId) {
        addActivity(`adicionou item "${name}"`, userName, userId);
      }

      addToQueue({
        type: "CREATE_ITEM" as MutationType,
        payload: { name, categoryId, imageUrl: image },
        tierListId: tierList.id,
      });
    },
    [tierList.id, addActivity, addToQueue],
  );

  const removeItem = useCallback(
    (itemId: string, userName: string, userId: string) => {
      const item = tierList.items.find((i) => i.id === itemId);

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
        updatedAt: now,
      }));

      if (item) {
        addActivity(`removeu item "${item.name}"`, userName, userId);
      }

      addToQueue({
        type: "DELETE_ITEM" as MutationType,
        payload: itemId,
        tierListId: tierList.id,
      });
    },
    [tierList.items, tierList.id, addActivity, addToQueue],
  );

  const moveItem = useCallback(
    (
      itemId: string,
      newCategoryId: string,
      destinationIndex: number,
      userName: string,
      userId: string,
    ) => {
      setTierList((prev) => {
        const categoriesSorted = [...prev.categories].sort(
          (a, b) => a.order - b.order,
        );
        const itemsByCategory = new Map<string, TierItem[]>();

        itemsByCategory.set(
          POOL_ID,
          prev.items.filter((i) => i.categoryId === POOL_ID),
        );
        categoriesSorted.forEach((c) =>
          itemsByCategory.set(
            c.id,
            prev.items.filter((i) => i.categoryId === c.id),
          ),
        );

        let movedItem: TierItem | null = null;
        for (const [catId, list] of itemsByCategory.entries()) {
          const idx = list.findIndex((it) => it.id === itemId);
          if (idx >= 0) {
            movedItem = list.splice(idx, 1)[0];
            break;
          }
        }

        if (!movedItem) return prev;

        movedItem.categoryId = newCategoryId;
        const destList = itemsByCategory.get(newCategoryId) || [];
        const insertIndex = Math.max(
          0,
          Math.min(destinationIndex, destList.length),
        );
        destList.splice(insertIndex, 0, movedItem);
        itemsByCategory.set(newCategoryId, destList);

        const newItems = [
          ...(itemsByCategory.get(POOL_ID) || []),
          ...categoriesSorted.flatMap((c) => itemsByCategory.get(c.id) || []),
        ];

        const now = new Date().toISOString();
        return {
          ...prev,
          items: newItems,
          updatedAt: now,
        };
      });

      const item = tierList.items.find((i) => i.id === itemId);
      const newCategory = tierList.categories.find(
        (c) => c.id === newCategoryId,
      );
      if (item && newCategory) {
        addActivity(
          `moveu "${item.name}" para categoria "${newCategory.name}"`,
          userName,
          userId,
        );
      } else if (item && newCategoryId === POOL_ID) {
        addActivity(
          `moveu "${item.name}" para o Banco de Itens`,
          userName,
          userId,
        );
      }

      addToQueue({
        type: "MOVE_ITEM" as MutationType,
        payload: {
          itemId,
          sourceCategoryId: item?.categoryId || POOL_ID,
          destinationCategoryId: newCategoryId,
          destinationIndex,
        },
        tierListId: tierList.id,
      });
    },
    [tierList.items, tierList.categories, tierList.id, addActivity, addToQueue],
  );

  const updateItem = useCallback(
    (
      itemId: string,
      updates: Partial<TierItem>,
      userName: string,
      userId: string,
    ) => {
      const oldItem = tierList.items.find((i) => i.id === itemId);

      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, ...updates } : i,
        ),
        updatedAt: now,
      }));

      if (oldItem && updates.name && updates.name !== oldItem.name) {
        addActivity(
          `renomeou item de "${oldItem.name}" para "${updates.name}"`,
          userName,
          userId,
        );
      }

      addToQueue({
        type: "UPDATE_ITEM" as MutationType,
        payload: { id: itemId, data: updates },
        tierListId: tierList.id,
      });
    },
    [tierList.items, tierList.id, addActivity, addToQueue],
  );

  const reorderItems = useCallback(
    (
      categoryId: string,
      sourceIndex: number,
      destinationIndex: number,
      userName: string,
      userId: string,
    ) => {
      setTierList((prev) => {
        const categoriesSorted = [...prev.categories].sort(
          (a, b) => a.order - b.order,
        );
        const itemsByCategory = new Map<string, TierItem[]>();

        itemsByCategory.set(
          POOL_ID,
          prev.items.filter((i) => i.categoryId === POOL_ID),
        );

        categoriesSorted.forEach((c) => {
          itemsByCategory.set(
            c.id,
            prev.items.filter((i) => i.categoryId === c.id),
          );
        });

        const list = itemsByCategory.get(categoryId) || [];
        if (
          sourceIndex < 0 ||
          sourceIndex >= list.length ||
          destinationIndex < 0 ||
          destinationIndex > list.length
        ) {
          return prev;
        }

        const newList = Array.from(list);
        const [moved] = newList.splice(sourceIndex, 1);
        newList.splice(destinationIndex, 0, moved);

        itemsByCategory.set(categoryId, newList);

        const now = new Date().toISOString();
        const newItems = [
          ...(itemsByCategory.get(POOL_ID) || []),
          ...categoriesSorted.flatMap((c) => itemsByCategory.get(c.id) || []),
        ];

        return {
          ...prev,
          items: newItems,
          updatedAt: now,
        };
      });

      const category = tierList.categories.find((c) => c.id === categoryId);
      const item = tierList.items.filter((i) => i.categoryId === categoryId)[
        sourceIndex
      ];
      if (category && item) {
        addActivity(
          `reordenou "${item.name}" dentro da categoria "${category.name}"`,
          userName,
          userId,
        );
      } else if (categoryId === POOL_ID && item) {
        addActivity(
          `reordenou "${item.name}" dentro do Banco de Itens`,
          userName,
          userId,
        );
      }

      addToQueue({
        type: "REORDER_ITEMS" as MutationType,
        payload: {
          itemId: item?.id,
          sourceCategoryId: categoryId,
          destinationCategoryId: categoryId,
          destinationIndex,
        },
        tierListId: tierList.id,
      });
    },
    [tierList.categories, tierList.items, tierList.id, addActivity, addToQueue],
  );

  const reorderCategories = useCallback(
    (categoryIds: string[], userName?: string, userId?: string) => {
      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories
          .map((c) => ({ ...c, order: categoryIds.indexOf(c.id) }))
          .sort((a, b) => a.order - b.order),
        updatedAt: now,
      }));

      if (userName && userId) {
        const names = categoryIds
          .map((id) => tierList.categories.find((c) => c.id === id)?.name || id)
          .join(", ");
        addActivity(`reordenou categorias: ${names}`, userName, userId);
      }

      addToQueue({
        type: "REORDER_CATEGORIES" as MutationType,
        payload: categoryIds,
        tierListId: tierList.id,
      });
    },
    [tierList.categories, tierList.id, addActivity, addToQueue],
  );

  // --- TIERLIST LEVEL ---

  const updateTierList = useCallback(
    (updates: Partial<TierList>) => {
      const now = new Date().toISOString();
      setTierList((prev) => ({
        ...prev,
        ...updates,
        updatedAt: now,
      }));

      if (
        updates.name ||
        updates.themeImage !== undefined ||
        updates.favorite !== undefined
      ) {
        addToQueue({
          type: "UPDATE_TIERLIST" as MutationType,
          payload: { id: tierList.id, data: updates },
          tierListId: tierList.id,
        });
      }
    },
    [tierList.id, addToQueue],
  );

  const createNewTierList = useCallback(
    async (data: {
      name: string;
      themeImage?: string;
      categories: { name: string; color: string }[];
    }): Promise<TierList> => {
      return createTierListAPI(data);
    },
    [createTierListAPI],
  );

  return {
    tierList,
    setTierList,
    isLoading,
    syncQueue: queue,
    syncProcessing: processing,
    syncError,
    addActivity,
    addCategory,
    removeCategory,
    updateCategory,
    addItem,
    removeItem,
    moveItem,
    updateItem,
    reorderCategories,
    reorderItems,
    updateTierList,
    createNewTierList,
  };
};
