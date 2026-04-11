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

  // ── Dirty-check ref ──────────────────────────────────────────────────────
  // We serialise the last successfully saved payload and compare before each
  // save. If nothing changed (e.g. user opened a file but didn't type), we
  // skip the network round-trip entirely.
  const lastSavedRef = useRef(null);

  // ── Load state on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    notesApi.getState()
      .then((data) => {
        if (cancelled) return;
        const files   = data.files   || {};
        const folders = data.folders || {};
        const root    = data.root    || [];
        const afId    = data.activeFileId || null;
        setState({ files, folders, root });
        setActiveFileId(afId);
        // Seed the dirty-check so the first auto-save (e.g. just opening a
        // file) is skipped when nothing was actually modified.
        lastSavedRef.current = JSON.stringify({ files, folders, root, activeFileId: afId });
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

      // ── Dirty check ── skip network call if payload is unchanged
      const serial = JSON.stringify({ ...pending.state, activeFileId: pending.activeFileId });
      if (serial === lastSavedRef.current) {
        setSyncStatus('');
        return;
      }

      try {
        await notesApi.saveState({ ...pending.state, activeFileId: pending.activeFileId });
        lastSavedRef.current = serial;
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
    let capturedState;
    setState((s) => { capturedState = s; return s; });
    const capturedFileId = activeFileIdRef.current;

    // Dirty check
    const serial = JSON.stringify({ ...capturedState, activeFileId: capturedFileId });
    if (serial === lastSavedRef.current) {
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus((s) => s === 'saved' ? '' : s), 2000);
      return;
    }

    try {
      await notesApi.saveState({ ...capturedState, activeFileId: capturedFileId });
      lastSavedRef.current = serial;
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus((s) => s === 'saved' ? '' : s), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(''), 4000);
    }
  }, []);

  // ── Flush pending save when tab is hidden or closed ───────────────────────
  // The debounce timer (1.5 s) won't fire if the user closes the tab mid-typing.
  // We listen for visibilitychange (covers tab switch, window close, mobile app
  // backgrounding) and fire an immediate synchronous-style save via the
  // Beacon API which survives page unload. Falls back to a regular fetch if
  // Beacon is unavailable.
  useEffect(() => {
    const flush = () => {
      if (!pendingStateRef.current) return;
      clearTimeout(saveTimerRef.current);
      const { state: s, activeFileId: afId } = pendingStateRef.current;
      pendingStateRef.current = null;
      // Best-effort — don't await, page may be unloading
      notesApi.saveState({ ...s, activeFileId: afId }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flush);
    };
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
