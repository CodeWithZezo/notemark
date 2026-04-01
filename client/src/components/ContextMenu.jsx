import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ show, x, y, onNewFile, onNewFolder, onRename, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handleMouseDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const handleKeyDown   = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown',   handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown',   handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  // Keep menu within viewport
  const style = {
    top:  Math.min(y, window.innerHeight - 188),
    left: Math.min(x, window.innerWidth  - 176),
  };

  return (
    <div ref={ref} className="ctx-menu show" style={style} role="menu" aria-label="File options">
      <div className="ctx-item" role="menuitem" tabIndex={0} onClick={() => { onNewFile(); onClose(); }} onKeyDown={(e) => e.key === 'Enter' && (onNewFile(), onClose())}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        New file here
      </div>
      <div className="ctx-item" role="menuitem" tabIndex={0} onClick={() => { onNewFolder(); onClose(); }} onKeyDown={(e) => e.key === 'Enter' && (onNewFolder(), onClose())}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 2h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        New subfolder
      </div>
      <div className="ctx-sep" role="separator" />
      <div className="ctx-item" role="menuitem" tabIndex={0} onClick={() => { onRename(); onClose(); }} onKeyDown={(e) => e.key === 'Enter' && (onRename(), onClose())}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Rename
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text3)' }}>F2</span>
      </div>
      <div className="ctx-item danger" role="menuitem" tabIndex={0} onClick={() => { onDelete(); onClose(); }} onKeyDown={(e) => e.key === 'Enter' && (onDelete(), onClose())}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        Delete
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text3)' }}>Del</span>
      </div>
    </div>
  );
}
