import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tierListApi, uploadApi, CreateTierListInput } from '../api/endpoints';
import { TierList, Category, User } from '../types';
import { generateId, formatDate } from '../utils/storage';
import {
  Folder,
  Star,
  Clock,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  User as UserIcon,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText
} from 'lucide-react';
import '../styles/Home.css';

interface HomeProps {
  onStartEditor: (list: TierList) => void;
}

interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  badge?: string;
  categories: { name: string; color: string }[];
  styleClass: string;
  icon: string;
}

export const Home: React.FC<HomeProps> = ({ onStartEditor }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateProfile } = useAuth();

  // Lists from API
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [filterAuthor, setFilterAuthor] = useState<'all' | 'me'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'alphabetical' | 'items'>('updated');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // New Board Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newUserName, setNewUserName] = useState(activeUser?.name || '');
  const [newBgImage, setNewBgImage] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PresetTemplate | null>(null);

  // Load tier lists from API
  const loadTierLists = useCallback(async () => {
    if (!activeUser) {
      setTierLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: 1,
        pageSize: 50,
        author: filterAuthor,
        sortBy,
      };
      if (searchQuery) params.search = searchQuery;
      if (sidebarTab === 'favorites') params.favorite = true;

      const response = await tierListApi.list(params);
      setTierLists(response.data.data);
    } catch (error) {
      console.error('Failed to load tier lists:', error);
      setTierLists([]);
    } finally {
      setLoading(false);
    }
  }, [activeUser, filterAuthor, sortBy, searchQuery, sidebarTab]);

  useEffect(() => {
    loadTierLists();
  }, [loadTierLists]);

  useEffect(() => {
    setActiveUser(user);
    if (user) setNewUserName(user.name);
  }, [user]);

  // Templates in Miro carousel format
  const presetTemplates: PresetTemplate[] = [
    {
      id: 'blank',
      name: 'Board em branco',
      description: 'Comece do zero com as tradicionais categorias (S, A, B, C, D)',
      badge: 'Básico',
      styleClass: 'template-blank',
      icon: '➕',
      categories: [
        { name: 'S', color: '#ff7f7f' },
        { name: 'A', color: '#ffbf7f' },
        { name: 'B', color: '#ffdf7f' },
        { name: 'C', color: '#ffff7f' },
        { name: 'D', color: '#bfff7f' },
      ],
    },
    {
      id: 'animes',
      name: 'Anime & Mangá',
      description: 'Avalie séries, episódios, personagens ou arcos de lançamentos',
      badge: 'Populares',
      styleClass: 'template-anime',
      icon: '✨',
      categories: [
        { name: '👑 Masterpiece', color: '#a855f7' },
        { name: '💥 Excelente', color: '#ec4899' },
        { name: '👍 Divertido', color: '#3b82f6' },
        { name: '💤 Mediano / Ok', color: '#eab308' },
        { name: '🗑️ Ruim / Fraco', color: '#64748b' },
      ],
    },
    {
      id: 'games',
      name: 'Rank de Jogos',
      description: 'O ranking perfeito contendo o lendário Rank S++ para os tops',
      badge: 'Gamer',
      styleClass: 'template-games',
      icon: '🎮',
      categories: [
        { name: '🎮 S++ (Lendário)', color: '#ca8a04' },
        { name: '🔥 S (Incrível)', color: '#ef4444' },
        { name: '⚡ A (Muito Bom)', color: '#f97316' },
        { name: '✨ B (Aceitável)', color: '#eab308' },
        { name: '👾 C (Ruim)', color: '#84cc16' },
        { name: '💀 F (Desastre)', color: '#06b6d4' },
      ],
    },
    {
      id: 'movies',
      name: 'Cinema & Séries',
      description: 'Classifique franquias, diretores, sagas ou temporadas completas',
      badge: 'Editorial',
      styleClass: 'template-movies',
      icon: '🍿',
      categories: [
        { name: '🎬 Obra de Arte', color: '#9d33d6' },
        { name: '⭐ Recomendo Muito', color: '#ec4899' },
        { name: '🍿 Vale o Ingresso', color: '#3b82f6' },
        { name: '😴 Cansativo', color: '#10b981' },
        { name: '👎 Péssimo', color: '#ef4444' },
      ],
    },
    {
      id: 'gourmet',
      name: 'Gourmet / Comidas',
      description: 'Hamburguerias, sobremesas, pratos rápidos ou culinária regional',
      badge: 'Lazer',
      styleClass: 'template-gourmet',
      icon: '🍕',
      categories: [
        { name: '🤤 Manjar Divino', color: '#f97316' },
        { name: '🍕 Uma Delícia', color: '#facc15' },
        { name: '🥗 Comível / Ok', color: '#4ade80' },
        { name: '🤢 Péssimo / Passo', color: '#f87171' },
      ],
    },
  ];

  // Favorite toggle via API
  const handleToggleFavorite = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    const list = tierLists.find(l => l.id === listId);
    if (!list) return;

    try {
      await tierListApi.update(listId, { favorite: !list.favorite });
      setTierLists(prev => prev.map(l => l.id === listId ? { ...l, favorite: !l.favorite } : l));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Erro ao atualizar favorito');
    }
  };

  // Delete via API
  const handleDeleteList = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja excluir esta Tier List permanentemente?')) return;

    try {
      await tierListApi.delete(listId);
      setTierLists(prev => prev.filter(l => l.id !== listId));
    } catch (error) {
      console.error('Failed to delete tier list:', error);
      alert('Erro ao excluir tier list');
    }
  };

  // Open creation flow from template card
  const handleSelectTemplate = (template: PresetTemplate) => {
    setSelectedTemplate(template);
    setNewListName(template.id === 'blank' ? '' : `${template.name} - Minha Lista`);
    setIsModalOpen(true);
  };

  const handleOpenBlankModal = () => {
    const blank = presetTemplates.find((t) => t.id === 'blank') || presetTemplates[0];
    setSelectedTemplate(blank);
    setNewListName('');
    setIsModalOpen(true);
  };

  // Execute creation
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newListName.trim() || !newUserName.trim()) {
      alert('Preencha o título e o seu Nickname para continuar.');
      return;
    }

    if (!activeUser) {
      alert('Você precisa estar logado para criar uma tier list.');
      return;
    }

    const activePreset = selectedTemplate || presetTemplates[0];
    const createData: CreateTierListInput = {
      name: newListName,
      themeImage: newBgImage,
      categories: activePreset.categories.map((cat) => ({ name: cat.name, color: cat.color })),
    };

    try {
      const response = await tierListApi.create(createData);
      const newTierList = response.data;
      setIsModalOpen(false);
      setNewListName('');
      setNewBgImage(undefined);
      setSelectedTemplate(null);
      onStartEditor(newTierList);
      navigate(`/editor?id=${newTierList.id}`);
    } catch (error) {
      console.error('Failed to create tier list:', error);
      alert('Erro ao criar tier list');
    }
  };

  // File Upload Handlers for Background Image
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewBgImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Profile changing support
  const handleQuickNameChange = async () => {
    if (!activeUser) return;
    const name = window.prompt('Digite seu novo nickname:', activeUser.name || '');
    if (name && name.trim()) {
      try {
        await updateProfile(name.trim());
        setActiveUser(prev => prev ? { ...prev, name: name.trim() } : null);
        setNewUserName(name.trim());
      } catch (error) {
        console.error('Failed to update profile:', error);
        alert('Erro ao atualizar nome');
      }
    }
  };

  // Core board lists processing (filters, search, and sorting)
  const filteredBoards = tierLists
    .filter((list) => {
      // 1. Search Query mapping
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        list.name.toLowerCase().includes(searchLower) ||
        list.userName.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // 2. Sidebar categories
      if (sidebarTab === 'favorites' && !list.favorite) return false;

      // 3. Middle filters
      if (filterAuthor === 'me' && activeUser && list.userId !== activeUser.id) return false;

      return true;
    })
    .sort((a, b) => {
      // 4. Sort calculations
      const getTime = (dateStr: string) => new Date(dateStr).getTime();
      if (sidebarTab === 'recent') {
        return getTime(b.updatedAt) - getTime(a.updatedAt); // Force updated order for recent
      }

      switch (sortBy) {
        case 'created':
          return getTime(b.createdAt) - getTime(a.createdAt);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'items':
          return b.items.length - a.items.length;
        case 'updated':
        default:
          return getTime(b.updatedAt) - getTime(a.updatedAt);
      }
    });

  // Initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="miro-dashboard">
      {/* 1. LEFT SIDEBAR */}
      <aside className="miro-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <span className="logo-spark">⚡</span>
            <span className="logo-text">Tierlist Maker</span>
          </div>
          <button onClick={handleOpenBlankModal} className="quick-add-btn" title="Novo Board">
            <Plus size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => { setSidebarTab('all'); }}
            className={`nav-item ${sidebarTab === 'all' ? 'active' : ''}`}
          >
            <Folder size={18} />
            <span>Todos os Boards</span>
          </button>

          <button
            onClick={() => { setSidebarTab('recent'); }}
            className={`nav-item ${sidebarTab === 'recent' ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Recentes</span>
          </button>

          <button
            onClick={() => { setSidebarTab('favorites'); }}
            className={`nav-item ${sidebarTab === 'favorites' ? 'active' : ''}`}
          >
            <Star size={18} className="star-icon-filled" />
            <span>Favoritos</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="active-space">
            <div className="space-badge">T</div>
            <div className="space-info">
              <span className="space-title">Meu Espaço</span>
              <span className="space-owner">
                {activeUser ? `Criador: ${activeUser.name}` : 'Visitante'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HUB CONTAINER */}
      <main className="miro-main-content">
        {/* UPPER BANNER SECTION: search / custom profile */}
        <header className="main-header">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por título ou criador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dashboard-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear-btn">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="user-profile-badge" onClick={handleQuickNameChange}>
            <div className="user-avatar" title="Clique para editar seu nome">
              {getInitials(activeUser?.name)}
            </div>
            <div className="user-meta hidden-mobile">
              <span className="user-greeting">Olá, desenvolvedor</span>
              <span className="user-name">{activeUser?.name || 'Visitante'} ✍</span>
            </div>
          </div>
        </header>

        {/* 3. HORIZONTAL TEMPLATES SHELF */}
        <section className="templates-section">
          <div className="section-title-wrap">
            <h2>Modelos para Começar</h2>
            <p>Selecione um molde planejado para criar instantaneamente com categorias prontas</p>
          </div>

          <div className="templates-carousel">
            {presetTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`template-card ${template.styleClass}`}
              >
                <div className="template-card-preview">
                  <span className="template-emoji">{template.icon}</span>
                  <div className="template-row-preview">
                    {template.categories.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="template-color-dot"
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                  {template.badge && <span className="template-badge">{template.badge}</span>}
                </div>
                <div className="template-card-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. BOARDS TABLE / GRID GRID IN MIDDLE */}
        <section className="boards-list-section">
          <div className="boards-settings-header">
            <h2 className="boards-title">
              {sidebarTab === 'all' && 'Todos os Boards'}
              {sidebarTab === 'recent' && 'Boards Abertos Recentemente'}
              {sidebarTab === 'favorites' && 'Boards Favoritados ⭐'}
            </h2>

            <div className="boards-filters-row">
              {/* Filter By Owner */}
              <div className="filter-dropdown-wrap">
                <span className="filter-label">Titular:</span>
                <select
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value as 'all' | 'me')}
                  className="filter-select"
                >
                  <option value="all">Qualquer titular</option>
 <option value="me">De minha autoria</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              {sidebarTab !== 'recent' && (
                <div className="filter-dropdown-wrap">
                  <span className="filter-label">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="filter-select"
                  >
                    <option value="updated">Última abertura</option>
                    <option value="created">Data de criação</option>
                    <option value="alphabetical">Ordem alfabética (A-Z)</option>
                    <option value="items">Contagem de itens</option>
                  </select>
                </div>
              )}

              {/* View switches */}
              <div className="view-mode-toggles">
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                  title="Visualização em Lista"
                >
                  <ListIcon size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>

              {/* Create new button */}
              <button onClick={handleOpenBlankModal} className="btn btn-primary create-new-board-btn">
                <Plus size={16} /> Criar Novo
              </button>
            </div>
          </div>

          {/* LIST WRAPPER */}
          {loading ? (
            <div className="empty-boards-state">
              <div className="empty-illustration">⏳</div>
              <h3>Carregando...</h3>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="empty-boards-state">
              <div className="empty-illustration">🗂️</div>
              <h3>Nenhum board encontrado</h3>
              <p>Não há tier lists que correspondem aos critérios de busca ou filtros selecionados.</p>
              <button onClick={handleOpenBlankModal} className="btn btn-secondary mt-2">
                Começar primeira Tier List 🚀
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* LINE/ROUND LIST VIEW EXACTLY LIKE MIRO */
            <div className="boards-list-container">
              <div className="boards-list-header-row">
                <div className="col-name">Nome</div>
                <div className="col-creator">Espaço / Criador</div>
                <div className="col-date">Última abertura</div>
                <div className="col-favorites">Favorito</div>
                <div className="col-actions">Ações</div>
              </div>

              <div className="boards-list-items">
                {filteredBoards.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => {
                      onStartEditor(list);
                      navigate(`/editor?id=${list.id}`);
                    }}
                    className="board-list-row"
                  >
                    <div className="col-name flex-align">
                      <div className="board-mini-preview">
                        {list.themeImage ? (
                          <img src={list.themeImage} alt="Cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="default-board-grid-icon">
                            <SlidersHorizontal size={14} />
                          </div>
                        )}
                      </div>
                      <div className="board-text-meta">
                        <span className="board-main-title">{list.name}</span>
                        <span className="board-tags">
                          {list.categories.length} categorias • {list.items.length} itens
                        </span>
                      </div>
                    </div>

                    <div className="col-creator text-secondary">
                      <span>{list.userName || 'Nome indefinido'}</span>
                    </div>

                    <div className="col-date text-secondary">
                      <span>{formatDate(list.updatedAt)}</span>
                    </div>

                    <div className="col-favorites" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleFavorite(e, list.id)}
                        className={`star-action-btn ${list.favorite ? 'starred' : ''}`}
                        title={list.favorite ? 'Remover favorito' : 'Favoritar'}
                      >
                        <Star size={18} fill={list.favorite ? '#f59e0b' : 'none'} />
                      </button>
                    </div>

                    <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onStartEditor(list);
                          navigate(`/editor?id=${list.id}`);
                        }}
                        className="action-icon-btn text-primary"
                        title="Abrir editor"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteList(e, list.id)}
                        className="action-icon-btn text-danger"
                        title="Deletar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
              /* GRID VIEW */
              <div className="boards-grid-container">
                {filteredBoards.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => {
                      onStartEditor(list);
                      navigate(`/editor?id=${list.id}`);
                    }}
                    className="board-grid-card"
                  >
                    <div className="grid-card-preview">
                      {list.themeImage ? (
                        <img src={list.themeImage} alt="Theme font" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="grid-default-background">
                          <div className="grid-gradient-blob" />
                          <SlidersHorizontal size={36} className="decor-icon" />
                        </div>
                      )}
                      <button
                        onClick={(e) => handleToggleFavorite(e, list.id)}
                        className={`grid-star-bubble ${list.favorite ? 'starred' : ''}`}
                      >
                        <Star size={16} fill={list.favorite ? '#f59e0b' : 'none'} />
                      </button>
                    </div>
                    <div className="grid-card-body">
                      <h3 className="grid-title" title={list.name}>{list.name}</h3>
                      <div className="grid-meta">
                        <span>Por {list.userName}</span>
                        <span>•</span>
                        <span>{list.items.length} itens</span>
                      </div>
                      <div className="grid-footer">
                        <span className="grid-time">{formatDate(list.updatedAt)}</span>
                        <button
                          onClick={(e) => handleDeleteList(e, list.id)}
                          className="grid-delete-btn"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* 5. GORGEOUS CREATION FLOW MODAL */}
        {isModalOpen && (
          <div className="miro-modal-overlay">
            <div className="miro-modal-card">
              <div className="modal-card-header">
                <div className="header-info">
                  <span className="modal-eyebrow">
                    Modelo: {selectedTemplate?.name || 'Tradicional'}
                  </span>
                  <h3>Nova Tier List</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="close-modal-btn">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateBoard} className="modal-creation-form">
                <div className="form-group">
                  <label className="form-label font-medium text-slate-300">
                    Título do Board <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ex: Melhores álbuns da história, ranks..."
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-medium text-slate-300">
                    Seu Nickname <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Seu nome de usuário..."
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-medium text-slate-300">
                    Imagem de fundo / Capa (Opcional)
                  </label>
                  
                  <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${
                      newBgImage ? 'has-image' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('modal-theme-file-input')?.click()}
                    style={{ minHeight: '140px', padding: '1rem' }}
                  >
                    {newBgImage ? (
                      <div className="theme-preview">
                        <img src={newBgImage} alt="Theme preview" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewBgImage(undefined);
                          }}
                          className="btn-remove"
                          title="Remover Imagem"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex-col-center">
                        <ImageIcon className="drop-icon-lucide" size={24} />
                        <p className="drop-zone-text text-xs text-slate-400">
                          Clique ou arraste uma capa aqui
                        </p>
                      </div>
                    )}
                    <input
                      id="modal-theme-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file-input-hidden"
                    />
                  </div>
                </div>

                <div className="modal-actions-buttons">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary py-3 flex-grow"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary py-3 flex-grow"
                  >
                    Começar Board 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
};
