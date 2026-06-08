import React, { useState } from "react";
import { Category } from "../types";
import "../styles/CategoryRow.css";

interface CategoryRowProps {
  category: Category;
  onUpdate: (updates: Partial<Category>) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  // Sync state with prop updates
  React.useEffect(() => {
    setEditName(category.name);
  }, [category.name]);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onUpdate({ name: editName });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditName(category.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="category-row-wrapper"
      style={{ display: "flex", width: "100%", height: "100%" }}
    >
      <div
        className="category-label"
        style={{ "--category-bg": category.color } as React.CSSProperties}
      >
        {isEditing ? (
          <div className="category-edit">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="category-input"
              autoFocus
            />
            <div className="category-color-picker-wrap">
              <input
                type="color"
                value={category.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="category-color-pipette"
                title="Cor do Tier"
              />
              <button onClick={handleSaveEdit} className="category-save-btn" title="Salvar">
                ✔
              </button>
            </div>
          </div>
        ) : (
          <div className="category-display" onClick={() => setIsEditing(true)} title="Clique para editar nome ou cor">
            <span className="category-name">{category.name}</span>
            <span className="category-click-guide">clique p/ editar</span>
          </div>
        )}
      </div>
    </div>
  );
};
