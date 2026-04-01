import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../hooks/useNotes';
import FileTree from './FileTree';
import Toolbar from './Toolbar';
import Preview from './Preview';
import Modal from './Modal';
import ContextMenu from './ContextMenu';

export default function NotemarkApp() {
  const { user, token, logout } = useAuth();
  const {
    state, activeFileId, loading, syncStatus,
    newFile, newFolder, openFile,
    updateFileContent, updateFileTitle,
    toggleFolder, renameItem, deleteItem, moveItem,
    saveNow,
  } = useNotes(token);

  const [isPreviewing, setIsPreviewing]       = useState(false);
  const [editorValue, setEditorValue]         = useState('');
  const [fileTitleValue, setFileTitleValue]   = useState('');
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [searchQuery, setSearchQuery]         = useState('');
  const [modal, setModal]                     = useState({ show: false, title: '', placeholder: '', okLabel: 'Create', resolve: null });
  const [ctx, setCtx]                         = useState({ show: false, x: 0, y: 0, type: null, id: null });
  const [dragId, setDragId]                   = useState(null);
  const [dragType, setDragType]               = useState(null);
  const [confirmDelete, setConfirmDelete]     = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const editorRef  = useRef(null);
  const searchRef  = useRef(null);
  const saveNowRef = useRef(saveNow);
  useEffect(() => { saveNowRef.current = saveNow; }, [saveNow]);

  // Sync editor when active file changes
  useEffect(() => {
    if (!activeFileId || !state.files[activeFileId]) {
      setEditorValue('');
      setFileTitleValue('');
      return;
    }
    const f = state.files[activeFileId];
    setEditorValue(f.content || '');
    setFileTitleValue(f.title || 'Untitled');
  }, [activeFileId, state.files]);

  // Stats
  const words = editorValue.trim() ? editorValue.trim().split(/\s+/).length : 0;
  const chars  = editorValue.length;
  const lines  = editorValue.split('\n').length;

  // Keyboard shortcuts — use ref so handler never goes stale
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNowRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setIsPreviewing(p => !p); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setSidebarOpen(p => !p); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []); // runs once — stable via ref

  // Breadcrumbs
  const getBreadcrumbs = () => {
    if (!activeFileId || !state.files[activeFileId]) return [];
    const path = [];
    let pid = state.files[activeFileId].parentFolder;
    while (pid && state.folders[pid]) {
      path.unshift({ id: pid, name: state.folders[pid].name });
      pid = state.folders[pid].parentFolder;
    }
    return path;
  };

  // Modal
  const promptModal = (title, placeholder, okLabel = 'Create') =>
    new Promise((resolve) => setModal({ show: true, title, placeholder, okLabel, resolve }));

  const closeModal = () => setModal((m) => { m.resolve?.(null); return { ...m, show: false }; });

  // Handlers
  const handleEditorChange = useCallback((e) => {
    const val = e.target.value;
    setEditorValue(val);
    if (activeFileId) updateFileContent(activeFileId, val);
  }, [activeFileId, updateFileContent]);

  const handleTitleChange = useCallback((e) => {
    const val = e.target.value;
    setFileTitleValue(val);
    if (activeFileId) updateFileTitle(activeFileId, val);
  }, [activeFileId, updateFileTitle]);

  const handleOpenFile = useCallback((id) => {
    openFile(id);
    setMobileSidebarOpen(false);
  }, [openFile]);

  const handleNewFile = useCallback(async (parentFolderId = null) => {
    const name = await promptModal('New file', 'e.g. readme.md', 'Create');
    if (name) newFile(parentFolderId, name);
  }, [newFile]);

  const handleNewFolder = useCallback(async (parentFolderId = null) => {
    const name = await promptModal('New folder', 'Folder name', 'Create');
    if (name) newFolder(parentFolderId, name);
  }, [newFolder]);

  const handleDeleteItem = useCallback((type, id) => {
    const name = type === 'file'
      ? (state.files[id]?.title || 'Untitled')
      : (state.folders[id]?.name || 'Folder');
    setConfirmDelete({ type, id, name });
  }, [state]);

  const handleContextMenu = useCallback((e, type, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === 'rename') {
      promptModal('Rename', 'New name', 'Rename').then((name) => { if (name) renameItem(type, id, name); });
      return;
    }
    if (action === 'delete') { handleDeleteItem(type, id); return; }
    if (action === 'newfile') { handleNewFile(id); return; }
    setCtx({ show: true, x: e.clientX, y: e.clientY, type, id });
  }, [renameItem, handleDeleteItem, handleNewFile]);

  const handleRenameInline = useCallback((type, id, name) => {
    renameItem(type, id, name);
  }, [renameItem]);

  const handleDragStart = useCallback((e, type, id) => {
    setDragId(id);
    setDragType(type);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetType, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    moveItem(dragType, dragId, targetId, targetType);
    setDragId(null);
    setDragType(null);
  }, [dragId, dragType, moveItem]);

  const handleCollapseAll = useCallback(() => {
    Object.keys(state.folders).forEach((id) => {
      if (state.folders[id].open) toggleFolder(id);
    });
  }, [state.folders, toggleFolder]);

  if (loading) {
    return (
      <div className="spinner-page" aria-label="Loading notes">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
    );
  }

  const activeFile = activeFileId ? state.files[activeFileId] : null;
  const crumbs     = getBreadcrumbs();

  const syncLabel =
    syncStatus === 'saving' ? 'saving…' :
    syncStatus === 'saved'  ? 'saved'   :
    syncStatus === 'error'  ? 'save failed' : '';

  return (
    <div className="app">
      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="topbar" role="banner">
        <button
          className="topbar-hamburger"
          onClick={() => setMobileSidebarOpen(p => !p)}
          aria-label="Toggle sidebar"
          aria-expanded={mobileSidebarOpen}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <button
          className="topbar-sidebar-toggle desktop-only"
          onClick={() => setSidebarOpen(p => !p)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title="Toggle sidebar (Ctrl+B)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {sidebarOpen
              ? <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></>
              : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></>}
          </svg>
        </button>

        <span className="logo" aria-label="Notemark">note<span aria-hidden="true">■</span>mark</span>

        <div className="topbar-center">
          <nav className="crumbs" aria-label="File path">
            {crumbs.map((seg) => (
              <React.Fragment key={seg.id}>
                <span className="crumb">{seg.name}</span>
                <span className="crumb-sep" aria-hidden="true">›</span>
              </React.Fragment>
            ))}
            {activeFile && (
              <input
                className="file-title-input"
                type="text"
                placeholder="Untitled note"
                spellCheck={false}
                value={fileTitleValue}
                onChange={handleTitleChange}
                aria-label="File title"
              />
            )}
          </nav>
        </div>

        <div className="topbar-right">
          {syncStatus && (
            <div className="sync-pill" role="status" aria-live="polite" aria-label={syncLabel}>
              <span className={`sync-dot ${syncStatus}`} aria-hidden="true" />
              {syncLabel}
            </div>
          )}
          <button
            className="topbtn"
            onClick={() => setIsPreviewing(p => !p)}
            aria-label={isPreviewing ? 'Switch to editor' : 'Preview markdown'}
            title="Toggle preview (Ctrl+P)"
          >
            {isPreviewing ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg><span className="desktop-only">Edit</span></>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span className="desktop-only">Preview</span></>
            )}
          </button>
          <button
            className="topbtn primary"
            onClick={saveNowRef.current}
            aria-label="Save now"
            title="Save (Ctrl+S)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span className="desktop-only">Save</span>
          </button>
          <div className="user-menu">
            <div className="user-avatar" aria-label={`Logged in as ${user?.username}`}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="user-name desktop-only">{user?.username}</span>
            <button className="topbtn ghost" onClick={logout} aria-label="Sign out">Sign out</button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="main">
        {/* Sidebar */}
        <aside
          className={`sidebar${sidebarOpen ? '' : ' collapsed'} ${mobileSidebarOpen ? 'mobile-open' : ''}`}
          aria-label="File explorer"
        >
          <div className="sidebar-top">
            <span className="sidebar-title">Explorer</span>
            <div className="sidebar-actions">
              <button className="sibtn" onClick={() => handleNewFile(null)} aria-label="New file" title="New file">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </button>
              <button className="sibtn" onClick={() => handleNewFolder(null)} aria-label="New folder" title="New folder">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              </button>
              <button className="sibtn" onClick={handleCollapseAll} aria-label="Collapse all folders" title="Collapse all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
            </div>
          </div>

          <div className="sidebar-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search files… (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search files"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>

          <FileTree
            state={state}
            activeFileId={activeFileId}
            onOpenFile={handleOpenFile}
            onToggleFolder={toggleFolder}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragId={dragId}
            onRenameInline={handleRenameInline}
            onDeleteItem={handleDeleteItem}
            searchQuery={searchQuery}
          />

          <div className="sidebar-footer" aria-label="File statistics">
            <span>{Object.keys(state.files).length} file{Object.keys(state.files).length !== 1 ? 's' : ''}</span>
            <span>{Object.keys(state.folders).length} folder{Object.keys(state.folders).length !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        {/* Editor area */}
        <main className="editor-area">
          <Toolbar
            editorRef={editorRef}
            onChange={() => {
              if (activeFileId) updateFileContent(activeFileId, editorRef.current?.value || '');
              setEditorValue(editorRef.current?.value || '');
            }}
            activeFileId={activeFileId}
            fileTitle={fileTitleValue}
          />

          {activeFile ? (
            <div className="editor-wrap">
              <textarea
                ref={editorRef}
                className="editor"
                placeholder={"# Start writing\n\nSelect text to apply formatting, or use the toolbar above.\n\n## Tips\n- Double-click files/folders in the sidebar to rename inline\n- Drag & drop files to reorder or move into folders\n- Right-click for more options"}
                value={editorValue}
                onChange={handleEditorChange}
                style={{ display: isPreviewing ? 'none' : 'block' }}
                spellCheck={false}
                aria-label="Markdown editor"
                aria-multiline="true"
              />
              <Preview content={editorValue} visible={isPreviewing} />
            </div>
          ) : (
            <div className="empty-state" role="main" aria-label="No file open">
              <div className="empty-icon" aria-hidden="true">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <rect x="10" y="6" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
                  <line x1="17" y1="17" x2="35" y2="17" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="17" y1="23" x2="35" y2="23" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="17" y1="29" x2="27" y2="29" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className="empty-title">No file open</p>
              <p className="empty-sub">Select a file from the sidebar or create a new one</p>
              <div className="empty-actions">
                <button onClick={() => handleNewFile(null)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  New file
                </button>
                <button onClick={() => handleNewFolder(null)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                  New folder
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Statusbar ──────────────────────────────────────────── */}
      <footer className="statusbar" aria-label="Editor statistics">
        <span className="stat">{words} words</span>
        <span className="stat-sep" aria-hidden="true">·</span>
        <span className="stat">{chars} chars</span>
        <span className="stat-sep" aria-hidden="true">·</span>
        <span className="stat">{lines} lines</span>
        {activeFile && (
          <span className="stat-filename desktop-only" aria-label={`Current file: ${fileTitleValue || 'Untitled'}`}>
            {fileTitleValue || 'Untitled'}
          </span>
        )}
        {syncStatus === 'error' && (
          <span className="stat-error" role="alert">⚠ Save failed — check your connection</span>
        )}
      </footer>

      {/* ── Confirm Delete ─────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="modal-overlay show"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="modal confirm-modal">
            <div className="confirm-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 id="confirm-delete-title">Delete {confirmDelete.type}?</h3>
            <p className="confirm-msg">
              <strong>"{confirmDelete.name}"</strong> will be permanently deleted.
              {confirmDelete.type === 'folder' && ' All files inside will also be deleted.'}
            </p>
            <div className="modal-btns">
              <button className="mbtn" onClick={() => setConfirmDelete(null)} autoFocus>Cancel</button>
              <button
                className="mbtn danger"
                onClick={() => { deleteItem(confirmDelete.type, confirmDelete.id); setConfirmDelete(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/Rename Modal ─────────────────────────────────── */}
      <Modal
        show={modal.show}
        title={modal.title}
        placeholder={modal.placeholder}
        okLabel={modal.okLabel}
        onOk={(val) => { modal.resolve?.(val); setModal((m) => ({ ...m, show: false })); }}
        onCancel={closeModal}
      />

      {/* ── Context Menu ───────────────────────────────────────── */}
      <ContextMenu
        show={ctx.show}
        x={ctx.x}
        y={ctx.y}
        onNewFile={() => handleNewFile(ctx.type === 'folder' ? ctx.id : null)}
        onNewFolder={() => handleNewFolder(ctx.type === 'folder' ? ctx.id : null)}
        onRename={() => promptModal('Rename', 'New name', 'Rename').then((name) => { if (name) renameItem(ctx.type, ctx.id, name); })}
        onDelete={() => handleDeleteItem(ctx.type, ctx.id)}
        onClose={() => setCtx((c) => ({ ...c, show: false }))}
      />
    </div>
  );
}
