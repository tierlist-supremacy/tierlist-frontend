import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tierListApi } from '../api/endpoints';
import { TierList } from '../types';
import '../styles/SavedListsPanel.css';

interface SavedListsPanelProps {
  onSelect: (id: string) => void;
}

export const SavedListsPanel: React.FC<SavedListsPanelProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [savedLists, setSavedLists] = useState<TierList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLists = async () => {
      if (!user) {
        setSavedLists([]);
        setLoading(false);
        return;
      }
      try {
        const response = await tierListApi.list({ author: 'me', pageSize: 50 });
        setSavedLists(response.data.data);
      } catch (error) {
        console.error('Failed to load saved lists:', error);
        setSavedLists([]);
      } finally {
        setLoading(false);
      }
    };
    loadLists();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta tier list?')) {
      try {
        await tierListApi.delete(id);
        setSavedLists(prev => prev.filter(list => list.id !== id));
      } catch (error) {
        console.error('Failed to delete tier list:', error);
        alert('Erro ao deletar tier list');
      }
    }
  };

  if (loading) {
    return (
      <div className="saved-lists-panel">
        <div className="saved-lists-header">
          <h3>📂 Minhas Tier Lists</h3>
        </div>
        <div className="saved-lists-container">
          <p className="empty-message">Carregando...</p>
        </div>
      </div>
    );
  }

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