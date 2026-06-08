import { useState, useCallback } from "react";
import { TierList, Category, TierItem, ActivityLog } from "../types";
import { generateId, formatDate } from "../utils/storage";

export const useTierList = (initialTierList: TierList) => {
  const [tierList, setTierList] = useState<TierList>(initialTierList);

  const addActivity = useCallback(
    (action: string, userName: string, userId: string) => {
      setTierList((prev) => ({
        ...prev,
        activities: [
          ...prev.activities,
          {
            id: generateId(),
            userId,
            userName,
            action,
            timestamp: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }));
    },
    [],
  );

  const addCategory = useCallback(
    (name: string, color: string, userName: string, userId: string) => {
      const newCategory: Category = {
        id: generateId(),
        name,
        color,
        order: tierList.categories.length,
      };

      setTierList((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));

      addActivity(`adicionou categoria "${name}"`, userName, userId);
    },
    [tierList.categories.length, addActivity],
  );

  const removeCategory = useCallback(
    (categoryId: string, userName: string, userId: string) => {
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== categoryId),
        items: prev.items.filter((item) => item.categoryId !== categoryId),
      }));

      const category = tierList.categories.find((c) => c.id === categoryId);
      if (category) {
        addActivity(`removeu categoria "${category.name}"`, userName, userId);
      }
    },
    [tierList.categories, addActivity],
  );

  const updateCategory = useCallback(
    (
      categoryId: string,
      updates: Partial<Category>,
      userName: string,
      userId: string,
    ) => {
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c,
        ),
      }));

      const oldCategory = tierList.categories.find((c) => c.id === categoryId);
      if (oldCategory && updates.name && updates.name !== oldCategory.name) {
        addActivity(
          `renomeou categoria de "${oldCategory.name}" para "${updates.name}"`,
          userName,
          userId,
        );
      }
    },
    [tierList.categories, addActivity],
  );

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
        image,
      };

      setTierList((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));

      if (userName && userId) {
        addActivity(`adicionou item "${name}"`, userName, userId);
      }
    },
    [addActivity],
  );

  const removeItem = useCallback(
    (itemId: string, userName: string, userId: string) => {
      const item = tierList.items.find((i) => i.id === itemId);
      setTierList((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
      }));

      if (item) {
        addActivity(`removeu item "${item.name}"`, userName, userId);
      }
    },
    [tierList.items, addActivity],
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
        const POOL_ID = "__POOL__";

        // gather items including pool
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

        // find and remove item from its current list
        let movedItem: TierItem | null = null;
        for (const [catId, list] of itemsByCategory.entries()) {
          const idx = list.findIndex((it) => it.id === itemId);
          if (idx >= 0) {
            movedItem = list.splice(idx, 1)[0];
            break;
          }
        }

        if (!movedItem) return prev;

        // set new category id and insert at destinationIndex
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

        return {
          ...prev,
          items: newItems,
          updatedAt: Date.now(),
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
      } else if (item && newCategoryId === "__POOL__") {
        addActivity(
          `moveu "${item.name}" para o Banco de Itens`,
          userName,
          userId,
        );
      }
    },
    [tierList.items, tierList.categories, addActivity],
  );

  const updateItem = useCallback(
    (
      itemId: string,
      updates: Partial<TierItem>,
      userName: string,
      userId: string,
    ) => {
      setTierList((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, ...updates } : i,
        ),
      }));

      const oldItem = tierList.items.find((i) => i.id === itemId);
      if (oldItem && updates.name && updates.name !== oldItem.name) {
        addActivity(
          `renomeou item de "${oldItem.name}" para "${updates.name}"`,
          userName,
          userId,
        );
      }
    },
    [tierList.items, addActivity],
  );

  const POOL_ID = "__POOL__";

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

        // include pool bucket
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

        // flatten: pool first, then categoriesSorted
        const newItems = [
          ...(itemsByCategory.get(POOL_ID) || []),
          ...categoriesSorted.flatMap((c) => itemsByCategory.get(c.id) || []),
        ];

        return {
          ...prev,
          items: newItems,
          updatedAt: Date.now(),
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
    },
    [tierList.categories, tierList.items, addActivity],
  );

  const reorderCategories = useCallback(
    (categoryIds: string[], userName?: string, userId?: string) => {
      setTierList((prev) => ({
        ...prev,
        categories: prev.categories
          .map((c) => ({ ...c, order: categoryIds.indexOf(c.id) }))
          .sort((a, b) => a.order - b.order),
        updatedAt: Date.now(),
      }));

      if (userName && userId) {
        const names = categoryIds
          .map((id) => tierList.categories.find((c) => c.id === id)?.name || id)
          .join(", ");
        addActivity(`reordenou categorias: ${names}`, userName, userId);
      }
    },
    [tierList.categories, addActivity],
  );

  return {
    tierList,
    setTierList,
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
  };
};
