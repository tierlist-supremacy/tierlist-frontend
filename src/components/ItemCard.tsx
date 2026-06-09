import React, { useState } from "react";
import { TierItem } from "../types";
import { optimizeImage } from "../utils/imageOptimizer";
import "../styles/ItemCard.css";

interface ItemCardProps {
  item: TierItem;
  onRemove: () => void;
  onUpdate: (updates: Partial<TierItem>) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onRemove,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onUpdate({ name: editName });
      setIsEditing(false);
    }
  };

  const handleImageSelect = (file?: File) => {
    if (!file) return;
    optimizeImage(file)
      .then((optimizedUrl) => {
        onUpdate({ imageUrl: optimizedUrl });
      })
      .catch((err) => {
        console.error("Erro ao otimizar imagem:", err);
      });
  };

  const itemImage = item.imageUrl || item.image;

  return (
    <div className={`item-card ${itemImage ? "has-image" : ""}`}>
      {itemImage && (
        <img src={itemImage} alt={item.name} className="item-image" referrerPolicy="no-referrer" />
      )}

      <div className="item-content">
        {isEditing ? (
          <div className="item-edit">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="item-input"
              autoFocus
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label
                className="btn btn-secondary btn-small"
                style={{ cursor: "pointer", fontSize: "10px", padding: "2px 4px" }}
              >
                Imagem
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                  style={{ display: "none" }}
                />
              </label>
              <button
                onClick={() => onUpdate({ image: undefined })}
                className="btn-small"
                style={{ fontSize: "10px", padding: "2px 4px" }}
              >
                Remover
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button onClick={handleSaveEdit} className="btn-small">
                ✔
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-small">
                ✖
              </button>
            </div>
          </div>
        ) : (
          <div className="item-display">
            <span className="item-name" title={item.name}>{item.name}</span>
            <div className="item-actions">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-icon"
                title="Editar"
              >
                ✏
              </button>
              <button
                onClick={onRemove}
                className="btn-icon btn-danger"
                title="Remover"
              >
                🗑
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
