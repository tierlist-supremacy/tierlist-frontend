import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Category } from "../types";
import { CategoryRow } from "./CategoryRow";

interface SortableCategoryProps {
  category: Category;
  children: React.ReactNode;
  onUpdate: (updates: Partial<Category>) => void;
  onRemove: () => void;
  onAddItem: (name: string, image?: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isDraggingOver: boolean;
}

export const SortableCategory: React.FC<SortableCategoryProps> = ({
  category,
  children,
  onUpdate,
  onRemove,
  onAddItem,
  onMoveUp,
  onMoveDown,
  isDraggingOver,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, data: { type: 'category' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tier-row ${isDraggingOver ? "dragging-over" : ""}`}
    >
      <div {...attributes} {...listeners} className="category-drag-handle">
        <CategoryRow
          category={category}
          onUpdate={onUpdate}
        />
      </div>
      <div className="items-container">
        {children}
      </div>
    </div>
  );
};
