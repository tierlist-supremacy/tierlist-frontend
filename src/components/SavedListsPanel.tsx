import React from 'react';
import { storage } from '../utils/storage';
import '../styles/SavedListsPanel.css';

interface SavedListsPanelProps {
  onSelect: (id: string) => void;
}

export const SavedListsPanel: React.FC<SavedListsPanelProps> = ({ onSelect }) => {
  const savedLists = storage.getAllTierLists();

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta tier list?')) {
      storage.deleteTierList(id);
      window.location.reload();
    }
  };

  return (
    <div className="saved-lists-panel">
      <div className="saved-lists-header">
        <h3>📂 Minhas Tier Lists</h3>
      </div>

      <div className="saved-lists-container">
        {savedLists.length === 0 ? (
          <p className="empty-message">Nenhuma tier list salva ainda</p>
        ) : (
          <ul className="saved-lists">
            {savedLists.map((list) => (
              <li key={list.id} className="saved-list-item">
                <div className="list-info">
                  <button
                    onClick={() => onSelect(list.id)}
                    className="list-name-btn"
                    title={list.name}
                  >
                    {list.name}
                  </button>
                  <p className="list-meta">
                    Por {list.userName} • {list.items.length} itens
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="btn-icon btn-danger"
                  title="Deletar"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
