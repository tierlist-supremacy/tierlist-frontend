import { useState } from "react";
import { createPortal } from "react-dom";
import { TierList, Category, TierItem, User } from "../types";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  useDroppable,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { CategoryRow } from "./CategoryRow";
import { ItemCard } from "./ItemCard";
import { optimizeImage } from "../utils/imageOptimizer";
import "../styles/TierListCanvas.css";

interface TierListCanvasProps {
  tierList: TierList;
  onAddCategory: (
    name: string,
    color: string,
    userName: string,
    userId: string,
  ) => void;
  onRemoveCategory: (
    categoryId: string,
    userName: string,
    userId: string,
  ) => void;
  onUpdateCategory: (
    categoryId: string,
    updates: Partial<Category>,
    userName: string,
    userId: string,
  ) => void;
  onAddItem: (
    name: string,
    categoryId: string,
    image?: string,
    userName?: string,
    userId?: string,
  ) => void;
  onRemoveItem: (itemId: string, userName: string, userId: string) => void;
  onMoveItem: (
    itemId: string,
    newCategoryId: string,
    destinationIndex: number,
    userName: string,
    userId: string,
  ) => void;
  onUpdateItem: (
    itemId: string,
    updates: Partial<TierItem>,
    userName: string,
    userId: string,
  ) => void;
  onReorderItems: (
    categoryId: string,
    sourceIndex: number,
    destinationIndex: number,
    userName: string,
    userId: string,
  ) => void;
  onReorderCategories: (
    orderedCategoryIds: string[],
    userName: string,
    userId: string,
  ) => void;
  user: User | null;
}

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DroppableArea: React.FC<DroppableAreaProps> = ({ id, children, className, style }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isOver ? "dragging-over" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
};

export const TierListCanvas: React.FC<TierListCanvasProps> = ({
  tierList,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onUpdateItem,
  onReorderItems,
  onReorderCategories,
  user,
}) => {
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#FF6B6B");

  // item pool state only for UI
  const [poolItemName, setPoolItemName] = useState("");
  const [poolItemImage, setPoolItemImage] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<TierItem | null>(null);

  // States for category row inline options & quick-adds
  const [activeRowSettingsId, setActiveRowSettingsId] = useState<string | null>(null);
  const [rowAddItemName, setRowAddItemName] = useState("");
  const [rowAddItemImage, setRowAddItemImage] = useState<string | null>(null);

  const POOL_ID = "__POOL__";

  const handleClearRow = (categoryId: string) => {
    if (!user) return;
    const itemsInCat = tierList.items.filter((item) => item.categoryId === categoryId);
    itemsInCat.forEach((item) => {
      onMoveItem(item.id, POOL_ID, 0, user.name, user.id);
    });
  };

  const handleRemoveCategorySafely = (categoryId: string) => {
    if (!user) return;
    const itemsInCat = tierList.items.filter((item) => item.categoryId === categoryId);
    itemsInCat.forEach((item) => {
      onMoveItem(item.id, POOL_ID, 0, user.name, user.id);
    });
    onRemoveCategory(categoryId, user.name, user.id);
    if (activeRowSettingsId === categoryId) {
      setActiveRowSettingsId(null);
    }
  };

  const handleRowAddItem = (categoryId: string) => {
    if (!user || !rowAddItemName.trim()) return;
    onAddItem(
      rowAddItemName,
      categoryId,
      rowAddItemImage || undefined,
      user.name,
      user.id
    );
    setRowAddItemName("");
    setRowAddItemImage(null);
    setActiveRowSettingsId(null);
  };

  const handleRowImageSelect = (file?: File) => {
    if (!file) return;
    optimizeImage(file)
      .then((optimizedUrl) => setRowAddItemImage(optimizedUrl))
      .catch((err) => console.error("Erro ao otimizar imagem da linha:", err));
  };

  // Sensory config for smooth drag response across devices (Touch drag vs mouse pointer)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // prevents small clicks from being treated as drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // hold-to-drag allows users to scroll up/down on mobile naturally
        tolerance: 6,
      },
    })
  );

  const handleAddCategory = () => {
    if (user && newCategoryName.trim()) {
      onAddCategory(newCategoryName, newCategoryColor, user.name, user.id);
      setNewCategoryName("");
      setNewCategoryColor("#FF6B6B");
      setShowNewCategoryForm(false);
    }
  };

  const handleAddToPool = () => {
    if (!user) return;
    if (!poolItemName.trim()) return;
    onAddItem(
      poolItemName,
      POOL_ID,
      poolItemImage || undefined,
      user.name,
      user.id,
    );
    setPoolItemName("");
    setPoolItemImage(null);
  };

  const handlePoolImageSelect = (file?: File) => {
    if (!file) return;
    optimizeImage(file)
      .then((optimizedUrl) => setPoolItemImage(optimizedUrl))
      .catch((err) => console.error("Erro ao otimizar imagem do pool:", err));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = tierList.items.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || !user) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the item being dragged
    const item = tierList.items.find((i) => i.id === activeId);
    if (!item) return;

    const sourceCategoryId = item.categoryId;

    // Resolve the destination container ID
    let destCategoryId: string;
    const overItem = tierList.items.find((i) => i.id === overId);
    if (overItem) {
      destCategoryId = overItem.categoryId;
    } else {
      destCategoryId = overId; // POOL_ID or category ID container directly
    }

    if (sourceCategoryId === destCategoryId) {
      // Reordering items within the same container
      const categoryItems = tierList.items.filter((i) => i.categoryId === sourceCategoryId);
      const sourceIndex = categoryItems.findIndex((i) => i.id === activeId);
      
      let destIndex = categoryItems.findIndex((i) => i.id === overId);
      if (destIndex === -1) {
        destIndex = categoryItems.length - 1;
      }

      if (sourceIndex !== -1 && destIndex !== -1 && sourceIndex !== destIndex) {
        onReorderItems(
          sourceCategoryId,
          sourceIndex,
          destIndex,
          user.name,
          user.id,
        );
      }
    } else {
      // Moving item to a different container
      const destItems = tierList.items.filter((i) => i.categoryId === destCategoryId);
      
      let destIndex = destItems.findIndex((i) => i.id === overId);
      if (destIndex === -1) {
        destIndex = destItems.length; // Append
      }

      onMoveItem(
        activeId,
        destCategoryId,
        destIndex,
        user.name,
        user.id,
      );
    }
  };

  const sortedCategories = [...tierList.categories].sort(
    (a, b) => a.order - b.order,
  );

  // Pool items
  const poolItems = tierList.items.filter((it) => it.categoryId === POOL_ID);

  return (
    <div className="tier-list-canvas">
      {tierList.themeImage && (
        <div className="theme-background">
          <img src={tierList.themeImage} alt="Theme" />
        </div>
      )}

      <div className="tier-list-content">
        <div className="tier-list-title">
          <h2>{tierList.name}</h2>
          <p className="tier-list-creator">Criado por {tierList.userName}</p>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="pool-area">
            <h3>Banco de Itens</h3>
            <div className="pool-controls">
              <input
                type="text"
                value={poolItemName}
                onChange={(e) => setPoolItemName(e.target.value)}
                placeholder="Nome do personagem..."
                className="form-input"
              />
              <label
                className="btn btn-secondary"
                style={{ cursor: "pointer" }}
              >
                📸 Imagem
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handlePoolImageSelect(e.target.files?.[0])}
                />
              </label>
              <button onClick={handleAddToPool} className="btn btn-primary">
                Adicionar ao Banco
              </button>
            </div>

            <SortableContext
              items={poolItems.map((item) => item.id)}
              strategy={rectSortingStrategy}
            >
              <DroppableArea
                id={POOL_ID}
                className="items-container pool-container"
                style={{ display: "flex", flexWrap: "wrap", gap: "12px", minHeight: "100px" }}
              >
                {poolItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onRemove={() =>
                      user && onRemoveItem(item.id, user.name, user.id)
                    }
                    onUpdate={(updates) =>
                      user &&
                      onUpdateItem(item.id, updates, user.name, user.id)
                    }
                  />
                ))}
              </DroppableArea>
            </SortableContext>
          </div>

          <div className="tier-list-rows">
            {sortedCategories.map((category, index) => (
              <div key={category.id} className="tier-row-outer" style={{ marginBottom: "8px" }}>
                <div
                  className="tier-row"
                  style={{ display: "flex", minHeight: "100px" }}
                >
                  <div className="category-row-container" style={{ width: "156px", flexShrink: 0 }}>
                    <CategoryRow
                      category={category}
                      onUpdate={(updates) =>
                        user &&
                        onUpdateCategory(
                          category.id,
                          updates,
                          user.name,
                          user.id,
                        )
                      }
                    />
                  </div>

                  <SortableContext
                    items={tierList.items
                      .filter((item) => item.categoryId === category.id)
                      .map((item) => item.id)}
                    strategy={rectSortingStrategy}
                  >
                    <DroppableArea
                      id={category.id}
                      className="items-container"
                      style={{ display: "flex", flexWrap: "wrap", gap: "2px", flexGrow: 1, padding: "2px", minHeight: "100px" }}
                    >
                      {tierList.items
                        .filter((item) => item.categoryId === category.id)
                        .map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={() =>
                              user &&
                              onRemoveItem(item.id, user.name, user.id)
                            }
                            onUpdate={(updates) =>
                              user &&
                              onUpdateItem(
                                item.id,
                                updates,
                                user.name,
                                user.id,
                              )
                            }
                          />
                        ))}
                    </DroppableArea>
                  </SortableContext>

                  {/* Right Side Options Controls like TierMaker */}
                  <div className="tier-row-settings-bar">
                    <button
                      onClick={() => {
                        if (!user) return;
                        const ordered = sortedCategories.map((c) => c.id);
                        const idx = ordered.indexOf(category.id);
                        if (idx > 0) {
                          const tmp = ordered[idx - 1];
                          ordered[idx - 1] = ordered[idx];
                          ordered[idx] = tmp;
                          onReorderCategories(ordered, user.name, user.id);
                        }
                      }}
                      disabled={index === 0}
                      className="row-control-arrow-btn"
                      title="Mover Linha para Cima"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => {
                        if (!user) return;
                        const ordered = sortedCategories.map((c) => c.id);
                        const idx = ordered.indexOf(category.id);
                        if (idx < ordered.length - 1) {
                          const tmp = ordered[idx + 1];
                          ordered[idx + 1] = ordered[idx];
                          ordered[idx] = tmp;
                          onReorderCategories(ordered, user.name, user.id);
                        }
                      }}
                      disabled={index === sortedCategories.length - 1}
                      className="row-control-arrow-btn"
                      title="Mover Linha para Baixo"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => {
                        setActiveRowSettingsId(
                          activeRowSettingsId === category.id ? null : category.id
                        );
                      }}
                      className={`row-control-gear-btn ${activeRowSettingsId === category.id ? "active" : ""}`}
                      title="Opções de Edição"
                    >
                      ⚙️
                    </button>

                    {/* Inline Settings Popover for current row */}
                    {activeRowSettingsId === category.id && (
                      <div className="row-settings-popover">
                        <div className="popover-section-header">
                          <span>Opções da Linha</span>
                          <button
                            onClick={() => setActiveRowSettingsId(null)}
                            className="popover-close-btn"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Preset Quick Colors */}
                        <div className="popover-colors-grid">
                          <label className="popover-label">Mudar Cor:</label>
                          <div className="quick-colors-list">
                            {[
                              "#ff7f7f", // S
                              "#ffbf7f", // A
                              "#ffdf7f", // B
                              "#ffff7f", // C
                              "#bfff7f", // D
                              "#7fbf7f", // E
                              "#7fffff", // F
                              "#3b82f6", // Blue
                              "#a855f7", // Purple
                              "#ec4899", // Pink
                              "#1e293b"  // Dark Grey
                            ].map((clr) => (
                              <button
                                key={clr}
                                style={{ backgroundColor: clr }}
                                className={`quick-color-dot ${category.color === clr ? "active" : ""}`}
                                onClick={() => {
                                  if (user) {
                                    onUpdateCategory(category.id, { color: clr }, user.name, user.id);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Quick Add Companion */}
                        <div className="popover-item-creator">
                          <label className="popover-label">Criar Item nesta Linha:</label>
                          <div className="inline-add-fields">
                            <input
                              type="text"
                              value={rowAddItemName}
                              onChange={(e) => setRowAddItemName(e.target.value)}
                              placeholder="Nome do personagem..."
                              className="popover-input"
                            />
                            <label className="popover-upload-btn">
                              📸
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => handleRowImageSelect(e.target.files?.[0])}
                              />
                            </label>
                            <button
                              onClick={() => handleRowAddItem(category.id)}
                              className="popover-add-action-btn"
                              disabled={!rowAddItemName.trim()}
                            >
                              Adicionar
                            </button>
                          </div>
                          {rowAddItemImage && (
                            <span className="popover-image-badge">✔ Imagem Carregada</span>
                          )}
                        </div>

                        {/* Danger zone actions */}
                        <div className="popover-danger-actions">
                          <button
                            onClick={() => {
                              if (confirm("Deseja realmente esvaziar todos os itens deste tier?")) {
                                handleClearRow(category.id);
                                setActiveRowSettingsId(null);
                              }
                            }}
                            className="danger-action-clean-btn"
                            title="Mover todos os itens desta linha para o Banco de Itens"
                          >
                            🧹 Limpar Linha
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Deseja deletar esta categoria? Seus itens serão movidos ao banco.")) {
                                handleRemoveCategorySafely(category.id);
                              }
                            }}
                            className="danger-action-delete-btn"
                            title="Remover esta categoria do tabuleiro"
                          >
                            🗑 Deletar Categoria
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>

          {createPortal(
            <DragOverlay>
              {activeItem ? (
                <div
                  className="item-wrapper dragging"
                  style={{ cursor: "grabbing" }}
                >
                  <ItemCard
                    item={activeItem}
                    onRemove={() => {}}
                    onUpdate={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>

        <div className="category-controls">
          {!showNewCategoryForm ? (
            <button
              onClick={() => setShowNewCategoryForm(true)}
              className="btn btn-secondary"
            >
              ➕ Adicionar Categoria
            </button>
          ) : (
            <div className="new-category-form">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria..."
                className="form-input"
                autoFocus
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="color-input"
                style={{ width: "40px", height: "40px" }}
              />
              <button onClick={handleAddCategory} className="btn btn-primary">
                Adicionar
              </button>
              <button
                onClick={() => setShowNewCategoryForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
