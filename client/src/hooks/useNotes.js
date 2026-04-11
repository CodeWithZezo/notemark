import { useState, useCallback, useRef, useEffect } from 'react';
import { notesApi } from '../utils/notesApi';

function uid() { return Math.random().toString(36).slice(2, 10); }

const EMPTY_STATE = { files: {}, folders: {}, root: [] };

export function useNotes() {
  const [state, setState]           = useState(EMPTY_STATE);
  const [activeFileId, setActiveFileId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'

  const saveTimerRef    = useRef(null);
  const pendingStateRef = useRef(null);
  // Keep a stable ref to activeFileId so callbacks don't go stale
  const activeFileIdRef = useRef(activeFileId);
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);

  // ── Load state on mount ──────────────────────────────────────────────────
  useEffect(() => {
    // Supabase session is managed internally — no token prop needed
    let cancelled = false;
    notesApi.getState()
      .then((data) => {
        if (cancelled) return;
        setState({ files: data.files || {}, folders: data.folders || {}, root: data.root || [] });
        setActiveFileId(data.activeFileId || null);
      })
      .catch((err) => { if (!cancelled) console.error('Failed to load notes:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Cleanup timer on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => { clearTimeout(saveTimerRef.current); };
  }, []);

  // ── Debounced auto-save ──────────────────────────────────────────────────
  const scheduleSave = useCallback((newState, newActiveFileId) => {
    pendingStateRef.current = { state: newState, activeFileId: newActiveFileId };
    clearTimeout(saveTimerRef.current);
    setSyncStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingStateRef.current;
      if (!pending) return;
      pendingStateRef.current = null;
      try {
        await notesApi.saveState({ ...pending.state, activeFileId: pending.activeFileId });
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus((s) => s === 'saved' ? '' : s), 2000);
      } catch (e) {
        console.error('Auto-save failed:', e);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus(''), 4000);
      }
    }, 1500);
  }, []);

  // ── Manual save ───────────────────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    pendingStateRef.current = null;
    setSyncStatus('saving');
    // Capture current values via functional setState trick
    let capturedState;
    setState((s) => { capturedState = s; return s; });
    const capturedFileId = activeFileIdRef.current;
    try {
      await notesApi.saveState({ ...capturedState, activeFileId: capturedFileId });
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus((s) => s === 'saved' ? '' : s), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 4000);
    }
  }, []);

  // ── File operations ───────────────────────────────────────────────────────
  const newFile = useCallback((parentFolderId = null, name = 'Untitled') => {
    const id = uid();
    const file = { id, title: name, content: '', created: Date.now(), parentFolder: parentFolderId };
    setState((prev) => {
      const next = {
        ...prev,
        files: { ...prev.files, [id]: file },
        folders: { ...prev.folders },
        root: [...prev.root],
      };
      if (parentFolderId && next.folders[parentFolderId]) {
        next.folders = {
          ...next.folders,
          [parentFolderId]: {
            ...next.folders[parentFolderId],
            children: [...next.folders[parentFolderId].children, { type: 'file', id }],
          },
        };
      } else {
        next.root = [...next.root, { type: 'file', id }];
      }
      scheduleSave(next, id);
      return next;
    });
    setActiveFileId(id);
    return id;
  }, [scheduleSave]);

  const newFolder = useCallback((parentFolderId = null, name = 'New Folder') => {
    const id = uid();
    const folder = { id, name, children: [], open: true, parentFolder: parentFolderId };
    setState((prev) => {
      const next = {
        ...prev,
        folders: { ...prev.folders, [id]: folder },
        root: [...prev.root],
      };
      if (parentFolderId && next.folders[parentFolderId]) {
        next.folders = {
          ...next.folders,
          [parentFolderId]: {
            ...next.folders[parentFolderId],
            children: [...next.folders[parentFolderId].children, { type: 'folder', id }],
          },
        };
      } else {
        next.root = [...next.root, { type: 'folder', id }];
      }
      scheduleSave(next, activeFileIdRef.current);
      return next;
    });
  }, [scheduleSave]);

  const openFile = useCallback((id) => {
    setActiveFileId(id);
    // Use ref so we get latest state without a stale closure
    setState((s) => { scheduleSave(s, id); return s; });
  }, [scheduleSave]);

  const updateFileContent = useCallback((id, content) => {
    setState((prev) => {
      if (!prev.files[id]) return prev;
      const next = {
        ...prev,
        files: { ...prev.files, [id]: { ...prev.files[id], content } },
      };
      scheduleSave(next, id);
      return next;
    });
  }, [scheduleSave]);

  const updateFileTitle = useCallback((id, title) => {
    setState((prev) => {
      if (!prev.files[id]) return prev;
      const next = {
        ...prev,
        files: { ...prev.files, [id]: { ...prev.files[id], title } },
      };
      scheduleSave(next, activeFileIdRef.current);
      return next;
    });
  }, [scheduleSave]);

  const toggleFolder = useCallback((id) => {
    setState((prev) => {
      if (!prev.folders[id]) return prev;
      const next = {
        ...prev,
        folders: {
          ...prev.folders,
          [id]: { ...prev.folders[id], open: !prev.folders[id].open },
        },
      };
      scheduleSave(next, activeFileIdRef.current);
      return next;
    });
  }, [scheduleSave]);

  const renameItem = useCallback((type, id, newName) => {
    setState((prev) => {
      const next = { ...prev };
      if (type === 'file' && next.files[id]) {
        next.files = { ...next.files, [id]: { ...next.files[id], title: newName } };
      } else if (type === 'folder' && next.folders[id]) {
        next.folders = { ...next.folders, [id]: { ...next.folders[id], name: newName } };
      }
      scheduleSave(next, activeFileIdRef.current);
      return next;
    });
  }, [scheduleSave]);

  const deleteItem = useCallback((type, id) => {
    setState((prev) => {
      const next = { ...prev, files: { ...prev.files }, folders: { ...prev.folders } };
      const removeFromList = (list) => list.filter((x) => !(x.type === type && x.id === id));

      next.root = removeFromList(prev.root);
      for (const fid of Object.keys(next.folders)) {
        next.folders[fid] = {
          ...next.folders[fid],
          children: removeFromList(next.folders[fid].children),
        };
      }

      if (type === 'file') {
        delete next.files[id];
      } else {
        const collectIds = (fid) => {
          const f = next.folders[fid];
          if (!f) return;
          f.children.forEach((c) => {
            if (c.type === 'folder') collectIds(c.id);
            else delete next.files[c.id];
          });
          delete next.folders[fid];
        };
        collectIds(id);
      }

      const nextActiveId = (type === 'file' && activeFileIdRef.current === id) ? null : activeFileIdRef.current;
      scheduleSave(next, nextActiveId);
      return next;
    });
    if (type === 'file' && activeFileIdRef.current === id) setActiveFileId(null);
  }, [scheduleSave]);

  const moveItem = useCallback((dragType, dragId, targetId, targetType) => {
    setState((prev) => {
      const next = {
        ...prev,
        root: [...prev.root],
        folders: { ...prev.folders },
      };

      const removeFromAll = (list) => list.filter((x) => !(x.type === dragType && x.id === dragId));

      next.root = removeFromAll(next.root);
      for (const fid of Object.keys(next.folders)) {
        next.folders[fid] = {
          ...next.folders[fid],
          children: removeFromAll(next.folders[fid].children),
        };
      }

      const entry = { type: dragType, id: dragId };
      if (targetType === 'folder' && next.folders[targetId]) {
        next.folders[targetId] = {
          ...next.folders[targetId],
          children: [entry, ...next.folders[targetId].children],
          open: true,
        };
      } else {
        const idx = next.root.findIndex((x) => x.id === targetId);
        if (idx >= 0) next.root.splice(idx + 1, 0, entry);
        else next.root.push(entry);
      }

      scheduleSave(next, activeFileIdRef.current);
      return next;
    });
  }, [scheduleSave]);

  return {
    state, activeFileId, loading, syncStatus,
    newFile, newFolder, openFile,
    updateFileContent, updateFileTitle,
    toggleFolder, renameItem, deleteItem, moveItem,
    saveNow,
  };
}
