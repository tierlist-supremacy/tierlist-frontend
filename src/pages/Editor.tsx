import React, { useRef, useEffect } from "react";
import { User, TierList } from "../types";
import { useTierList } from "../hooks/useTierList";
import { useNavigate } from "../utils/router";
import { storage } from "../utils/storage";
import { exportToPNG, exportToPDF, exportToJSON, importFromJSON } from "../utils/export";
import { TierListCanvas } from "../components/TierListCanvas";
import { ActivityPanel } from "../components/ActivityPanel";
import { SavedListsPanel } from "../components/SavedListsPanel";
import "../styles/Editor.css";

interface EditorProps {
  currentList: TierList | null;
  onSetCurrentList: (list: TierList | null) => void;
}

export const Editor: React.FC<EditorProps> = ({ currentList, onSetCurrentList }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const user = storage.getUser();

  // Load from database if ID matches in search param & state is empty
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && !currentList) {
      const stored = storage.getTierList(id);
      if (stored) {
        onSetCurrentList(stored);
      }
    }
  }, [currentList, onSetCurrentList]);

  // Hook handles complete list manipulation triggers
  const {
    tierList,
    setTierList, // support loading saved designs
    addCategory,
    removeCategory,
    updateCategory,
    addItem,
    removeItem,
    moveItem,
    updateItem,
    reorderCategories,
    reorderItems,
  } = useTierList(
    currentList || {
      id: "fallback",
      name: "Nova Lista",
      userName: user?.name || "Visitante",
      userId: user?.id || "unknown",
      categories: [],
      items: [],
      activities: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  );

  // Auto-save changes locally on updates
  useEffect(() => {
    if (tierList.id !== "fallback") {
      storage.saveTierList(tierList);
    }
  }, [tierList]);

  const handleExportPNG = async () => {
    if (canvasRef.current) {
      try {
        await exportToPNG(canvasRef.current, tierList.name);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExportPDF = async () => {
    if (canvasRef.current) {
      try {
        await exportToPDF(canvasRef.current, tierList.name);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExportJSON = () => {
    exportToJSON(tierList, tierList.name);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = (await importFromJSON(file)) as TierList;
        // Verify minimal integrity
        if (data.name && Array.isArray(data.categories) && Array.isArray(data.items)) {
          setTierList(data);
          onSetCurrentList(data);
          storage.saveTierList(data);
          alert("Backup importado com sucesso!");
        } else {
          alert("Arquivo JSON inválido!");
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleClearActivities = () => {
    setTierList((prev) => ({
      ...prev,
      activities: [],
    }));
  };

  const handleSelectList = (id: string) => {
    const selected = storage.getTierList(id);
    if (selected) {
      onSetCurrentList(selected);
      setTierList(selected);
      navigate(`/editor?id=${selected.id}`);
    }
  };

  if (tierList.id === "fallback") {
    return (
      <div className="editor-error">
        <h2>⚠️ Tier List não encontrada!</h2>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <h1>⚡ Modo Editor</h1>
          {user && (
            <p className="user-info">
              Trabalhando como: <strong>{user.name}</strong>
            </p>
          )}
        </div>

        <div className="header-right">
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            🏠 Menu Principal
          </button>

          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            📥 Importar Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: "none" }}
            />
          </label>

          <div className="export-dropdown">
            <button className="btn btn-primary">💾 Exportar / Salvar ▼</button>
            <div className="dropdown-menu">
              <button onClick={handleExportPNG}>Baixar PNG</button>
              <button onClick={handleExportPDF}>Baixar PDF</button>
              <button onClick={handleExportJSON}>Baixar Backup (JSON)</button>
            </div>
          </div>
        </div>
      </header>

      <main className="editor-main">
        <div className="editor-canvas-wrapper">
          <div ref={canvasRef} className="tier-list-wrapper">
            <TierListCanvas
              tierList={tierList}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onUpdateCategory={updateCategory}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onMoveItem={moveItem}
              onUpdateItem={updateItem}
              onReorderItems={reorderItems}
              onReorderCategories={reorderCategories}
              user={user}
            />
          </div>
        </div>

        <div
          className="editor-sidebar"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <ActivityPanel
            activities={tierList.activities}
            onClear={handleClearActivities}
          />
          <SavedListsPanel onSelect={handleSelectList} />
        </div>
      </main>
    </div>
  );
};
