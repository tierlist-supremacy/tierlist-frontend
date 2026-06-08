import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TierItem } from "../types";
import { ItemCard } from "./ItemCard";

interface SortableItemProps {
  item: TierItem;
  onRemove: () => void;
  onUpdate: (updates: Partial<TierItem>) => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  item,
  onRemove,
  onUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="item-wrapper"
    >
      <ItemCard item={item} onRemove={onRemove} onUpdate={onUpdate} />
    </div>
  );
};
