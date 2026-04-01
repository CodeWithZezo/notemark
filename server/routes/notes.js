const express = require('express');
const NoteState = require('../models/NoteState');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All notes routes require auth
router.use(protect);

const MAX_TITLE_LEN   = 500;
const MAX_CONTENT_LEN = 500_000; // ~500KB per file
const MAX_FILES       = 2000;
const MAX_FOLDERS     = 500;

// ── GET /api/notes ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let state = await NoteState.findOne({ user: req.user._id });
    if (!state) {
      state = await NoteState.create({ user: req.user._id });
    }
    res.json({
      files:       Object.fromEntries(state.files),
      folders:     Object.fromEntries(state.folders),
      root:        state.root,
      activeFileId: state.activeFileId,
    });
  } catch (err) {
    console.error('GET /notes error:', err.message);
    res.status(500).json({ message: 'Failed to load notes.' });
  }
});

// ── PUT /api/notes ────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { files, folders, root, activeFileId } = req.body;

    // Guard: reject non-objects
    if (files && typeof files !== 'object') return res.status(400).json({ message: 'Invalid files payload.' });
    if (folders && typeof folders !== 'object') return res.status(400).json({ message: 'Invalid folders payload.' });

    // Guard: cap collection sizes
    if (files && Object.keys(files).length > MAX_FILES) {
      return res.status(400).json({ message: `Cannot exceed ${MAX_FILES} files.` });
    }
    if (folders && Object.keys(folders).length > MAX_FOLDERS) {
      return res.status(400).json({ message: `Cannot exceed ${MAX_FOLDERS} folders.` });
    }

    const filesMap = new Map();
    if (files) {
      for (const [id, file] of Object.entries(files)) {
        if (typeof id !== 'string' || id.length > 64) continue;
        filesMap.set(id, {
          id,
          title:        String(file.title  || 'Untitled').slice(0, MAX_TITLE_LEN),
          content:      String(file.content || '').slice(0, MAX_CONTENT_LEN),
          parentFolder: file.parentFolder ? String(file.parentFolder).slice(0, 64) : null,
          created:      typeof file.created === 'number' ? file.created : Date.now(),
          updatedAt:    Date.now(),
        });
      }
    }

    const foldersMap = new Map();
    if (folders) {
      for (const [id, folder] of Object.entries(folders)) {
        if (typeof id !== 'string' || id.length > 64) continue;
        foldersMap.set(id, {
          id,
          name:         String(folder.name || 'Folder').slice(0, MAX_TITLE_LEN),
          children:     Array.isArray(folder.children) ? folder.children.slice(0, 2000) : [],
          open:         Boolean(folder.open),
          parentFolder: folder.parentFolder ? String(folder.parentFolder).slice(0, 64) : null,
        });
      }
    }

    const state = await NoteState.findOneAndUpdate(
      { user: req.user._id },
      {
        files:       filesMap,
        folders:     foldersMap,
        root:        Array.isArray(root) ? root.slice(0, 2000) : [],
        activeFileId: activeFileId ? String(activeFileId).slice(0, 64) : null,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Saved', updatedAt: state.updatedAt });
  } catch (err) {
    console.error('PUT /notes error:', err.message);
    res.status(500).json({ message: 'Failed to save notes.' });
  }
});

// ── PATCH /api/notes/file/:fileId ─────────────────────────────────────────
router.patch('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId || fileId.length > 64) return res.status(400).json({ message: 'Invalid file ID.' });

    const { title, content } = req.body;
    const state = await NoteState.findOne({ user: req.user._id });
    if (!state) return res.status(404).json({ message: 'No notes state found.' });

    const file = state.files.get(fileId);
    if (!file) return res.status(404).json({ message: 'File not found.' });

    if (title !== undefined)   file.title   = String(title).slice(0, MAX_TITLE_LEN);
    if (content !== undefined) file.content = String(content).slice(0, MAX_CONTENT_LEN);
    file.updatedAt = Date.now();

    state.files.set(fileId, file);
    state.markModified('files');
    await state.save();

    res.json({ message: 'File updated', file });
  } catch (err) {
    console.error('PATCH /notes/file error:', err.message);
    res.status(500).json({ message: 'Failed to update file.' });
  }
});

// ── DELETE /api/notes/file/:fileId ────────────────────────────────────────
router.delete('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId || fileId.length > 64) return res.status(400).json({ message: 'Invalid file ID.' });

    const state = await NoteState.findOne({ user: req.user._id });
    if (!state) return res.status(404).json({ message: 'No notes state found.' });

    state.files.delete(fileId);
    state.root = state.root.filter(item => !(item.type === 'file' && item.id === fileId));

    for (const [folderId, folder] of state.folders) {
      folder.children = folder.children.filter(item => !(item.type === 'file' && item.id === fileId));
      state.folders.set(folderId, folder);
    }

    state.markModified('files');
    state.markModified('folders');
    state.markModified('root');
    await state.save();

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('DELETE /notes/file error:', err.message);
    res.status(500).json({ message: 'Failed to delete file.' });
  }
});

module.exports = router;
