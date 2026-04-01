const mongoose = require('mongoose');

// Recursive schema for tree items (files + folders)
const treeItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['file', 'folder'], required: true },
  id: { type: String, required: true },
}, { _id: false });

const folderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  children: [treeItemSchema],
  open: { type: Boolean, default: true },
  parentFolder: { type: String, default: null },
}, { _id: false });

const fileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: 'Untitled' },
  content: { type: String, default: '' },
  parentFolder: { type: String, default: null },
  created: { type: Number, default: () => Date.now() },
  updatedAt: { type: Number, default: () => Date.now() },
}, { _id: false });

const noteStateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  files: {
    type: Map,
    of: fileSchema,
    default: {},
  },
  folders: {
    type: Map,
    of: folderSchema,
    default: {},
  },
  root: {
    type: [treeItemSchema],
    default: [],
  },
  activeFileId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('NoteState', noteStateSchema);
