import React, { useRef, useEffect } from "react";
import { User, TierList } from "../types";
import { useTierList } from "../hooks/useTierList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();

  const {
    tierList,
    setTierList,
    isLoading,
    syncQueue,
    syncProcessing,
    syncError,
    addCategory,
    removeCategory,
    updateCategory,
    addItem,
    removeItem,
    moveItem,
    updateItem,
    reorderCategories,
    reorderItems,
    createNewTierList,
  } = useTierList(
    currentList || {
      id: "fallback",
      name: "Nova Lista",
      userName: user?.name || "Visitante",
      userId: user?.id || "unknown",
      themeImage: null,
      isPublic: true,
      favorite: false,
      categories: [],
      items: [],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    user
  );

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
        if (data.name && Array.isArray(data.categories) && Array.isArray(data.items)) {
          setTierList(data);
          onSetCurrentList(data);
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
    navigate(`/editor?id=${id}`);
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