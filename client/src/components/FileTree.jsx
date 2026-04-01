import React, { useState, useRef, useEffect } from 'react';

function getFileIcon(title = '') {
  const name = title.toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) return { icon: '✦', color: '#7aa2f7' };
  if (name.endsWith('.js') || name.endsWith('.jsx')) return { icon: '⚡', color: '#e0af68' };
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return { icon: '⬡', color: '#7dcfff' };
  if (name.endsWith('.json')) return { icon: '{}', color: '#9ece6a' };
  if (name.endsWith('.css') || name.endsWith('.scss')) return { icon: '◈', color: '#bb9af7' };
  if (name.endsWith('.html')) return { icon: '⊞', color: '#f7768e' };
  if (name.endsWith('.py')) return { icon: '⚙', color: '#73daca' };
  if (name.endsWith('.sh')) return { icon: '$', color: '#89ddff' };
  return { icon: '◉', color: '#b5b5b5' };
}

function getFolderColor(name = '') {
  const colors = ['#c46b4a','#5f8f6b','#7aa2f7','#bb9af7','#e0af68','#73daca','#f7768e'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function InlineRename({ value, onSave, onCancel }) {
  const [val, setVal] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const save = () => { if (val.trim()) onSave(val.trim()); else onCancel(); };
  return (
    <input
      ref={inputRef}
      className="tree-inline-rename"
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
      onBlur={save}
      onClick={e => e.stopPropagation()}
    />
  );
}

function TreeItem({ item, depth, state, activeFileId, onOpenFile, onToggleFolder, onContextMenu, onDragStart, onDragOver, onDrop, dragId, onRenameInline, onDeleteItem, searchQuery }) {
  const [renamingInline, setRenamingInline] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (item.type === 'folder') {
    const folder = state.folders[item.id];
    if (!folder) return null;
    const isOpen = folder.open;
    const color = getFolderColor(folder.name);
    const hasMatch = searchQuery && folder.name.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div className="tree-item">
        <div
          className={`tree-row folder-row${dragOver ? ' drag-over' : ''}${dragId === item.id ? ' dragging' : ''}`}
          draggable
          onDragStart={(e) => onDragStart(e, 'folder', item.id)}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { setDragOver(false); onDrop(e, 'folder', item.id); }}
          onContextMenu={(e) => onContextMenu(e, 'folder', item.id)}
          onClick={() => !renamingInline && onToggleFolder(item.id)}
          onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenamingInline(true); }}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <span className={`folder-arrow${isOpen ? ' open' : ''}`}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M3 2l4 3-4 3z"/></svg>
          </span>
          <span className="folder-icon-wrap" style={{ color }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              {isOpen
                ? <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                : <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>}
            </svg>
          </span>
          {renamingInline
            ? <InlineRename value={folder.name} onSave={(name) => { onRenameInline('folder', item.id, name); setRenamingInline(false); }} onCancel={() => setRenamingInline(false)} />
            : <span className={`tree-label${hasMatch ? ' search-match' : ''}`}>{folder.name}</span>}
          <span className="tree-badge">{folder.children.length}</span>
          <div className="tree-actions">
            <button className="ta-btn" title="New file in folder" onClick={(e) => { e.stopPropagation(); onContextMenu(e, 'folder', item.id, 'newfile'); }}>＋</button>
            <button className="ta-btn" title="Rename (or double-click)" onClick={(e) => { e.stopPropagation(); setRenamingInline(true); }}>✎</button>
            <button className="ta-btn danger" title="Delete folder" onClick={(e) => { e.stopPropagation(); onDeleteItem('folder', item.id); }}>✕</button>
          </div>
        </div>
        <div className={`tree-children${isOpen ? ' open' : ''}`}>
          {folder.children.map((child) => (
            <TreeItem key={child.id} item={child} depth={depth + 1} state={state} activeFileId={activeFileId} onOpenFile={onOpenFile} onToggleFolder={onToggleFolder} onContextMenu={onContextMenu} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} dragId={dragId} onRenameInline={onRenameInline} onDeleteItem={onDeleteItem} searchQuery={searchQuery} />
          ))}
          {folder.children.length === 0 && isOpen && (
            <div className="tree-empty-folder" style={{ paddingLeft: `${28 + (depth + 1) * 16}px` }}>empty</div>
          )}
        </div>
      </div>
    );
  }

  const file = state.files[item.id];
  if (!file) return null;
  const isActive = activeFileId === item.id;
  const { icon, color } = getFileIcon(file.title);
  const hasMatch = searchQuery && file.title.toLowerCase().includes(searchQuery.toLowerCase());
  if (searchQuery && !hasMatch) return null;

  return (
    <div className="tree-item">
      <div
        className={`tree-row file-row${isActive ? ' active' : ''}${dragId === item.id ? ' dragging' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, 'file', item.id)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => onDrop(e, 'file', item.id)}
        onContextMenu={(e) => onContextMenu(e, 'file', item.id)}
        onClick={() => !renamingInline && onOpenFile(item.id)}
        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenamingInline(true); }}
        style={{ paddingLeft: `${24 + depth * 16}px` }}
      >
        <span className="file-icon" style={{ color }}>{icon}</span>
        {renamingInline
          ? <InlineRename value={file.title || 'Untitled'} onSave={(name) => { onRenameInline('file', item.id, name); setRenamingInline(false); }} onCancel={() => setRenamingInline(false)} />
          : <span className={`tree-label${hasMatch ? ' search-match' : ''}`}>{file.title || 'Untitled'}</span>}
        <div className="tree-actions">
          <button className="ta-btn" title="Rename (or double-click)" onClick={(e) => { e.stopPropagation(); setRenamingInline(true); }}>✎</button>
          <button className="ta-btn danger" title="Delete file" onClick={(e) => { e.stopPropagation(); onDeleteItem('file', item.id); }}>✕</button>
        </div>
      </div>
    </div>
  );
}

export default function FileTree({ state, activeFileId, onOpenFile, onToggleFolder, onContextMenu, onDragStart, onDragOver, onDrop, dragId, onRenameInline, onDeleteItem, searchQuery }) {
  const checkFolderMatch = (fid) => {
    const folder = state.folders[fid];
    if (!folder) return false;
    if (folder.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    return folder.children.some(c =>
      c.type === 'file'
        ? (state.files[c.id]?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        : checkFolderMatch(c.id)
    );
  };

  const filtered = searchQuery
    ? state.root.filter(item => {
        if (item.type === 'file') return (state.files[item.id]?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        return checkFolderMatch(item.id);
      })
    : state.root;

  return (
    <div className="tree">
      {filtered.length === 0 && (
        <div className="tree-no-results">{searchQuery ? `No results for "${searchQuery}"` : 'No files yet'}</div>
      )}
      {filtered.map((item) => (
        <TreeItem key={item.id} item={item} depth={0} state={state} activeFileId={activeFileId} onOpenFile={onOpenFile} onToggleFolder={onToggleFolder} onContextMenu={onContextMenu} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} dragId={dragId} onRenameInline={onRenameInline} onDeleteItem={onDeleteItem} searchQuery={searchQuery} />
      ))}
    </div>
  );
}
