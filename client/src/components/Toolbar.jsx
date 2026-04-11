import React, { memo } from 'react';

const WRAP_BTNS = [
  { md: '**',  label: 'B',       title: 'Bold',        style: { fontWeight: 700 } },
  { md: '_',   label: 'I',       title: 'Italic',      style: { fontStyle: 'italic' } },
  { md: '~~',  label: 'S',       title: 'Strikethrough', style: { textDecoration: 'line-through' } },
];
const LINE_BTNS = [
  { prefix: '# ',  label: 'H1', title: 'Heading 1' },
  { prefix: '## ', label: 'H2', title: 'Heading 2' },
  { prefix: '### ',label: 'H3', title: 'Heading 3' },
  { prefix: '- ',  label: '• list', title: 'Bullet list' },
  { prefix: '1. ', label: '1. list', title: 'Ordered list' },
  { prefix: '> ',  label: '❝', title: 'Blockquote' },
];

function applyWrap(textarea, marker) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = marker + (sel || 'text') + marker;
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

function applyLinePrefix(textarea, prefix) {
  const { selectionStart: s, value } = textarea;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const current = value.slice(lineStart, s);
  if (current.startsWith(prefix)) {
    textarea.setRangeText('', lineStart, lineStart + prefix.length, 'end');
  } else {
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');
  }
  textarea.focus();
}

function applyCodeBlock(textarea) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = '```\n' + (sel || '') + '\n```';
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

function applyLink(textarea) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = '[' + (sel || 'text') + '](url)';
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

// memo: Toolbar only re-renders when activeFileId or fileTitle changes.
// It does NOT depend on editorValue, so frequent typing never touches it.
const Toolbar = memo(function Toolbar({ editorRef, onChange, activeFileId, fileTitle }) {
  const ed = () => editorRef.current;

  const handleWrap = (marker) => { applyWrap(ed(), marker); onChange(); };
  const handleLine = (prefix) => { applyLinePrefix(ed(), prefix); onChange(); };
  const handleCodeBlock = () => { applyCodeBlock(ed()); onChange(); };
  const handleLink = () => { applyLink(ed()); onChange(); };

  const handleDownload = () => {
    if (!activeFileId || !ed()) return;
    const blob = new Blob([ed().value], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (fileTitle || 'note') + '.md';
    a.click();
  };

  return (
    <div className="toolbar">
      {WRAP_BTNS.map(({ md, label, title, style }) => (
        <button key={md} className="tbtn" title={title} style={style} onClick={() => handleWrap(md)}>
          {label}
        </button>
      ))}
      <div className="tbtn-sep" />
      {LINE_BTNS.map(({ prefix, label, title }) => (
        <button key={prefix} className="tbtn" title={title} onClick={() => handleLine(prefix)}>
          {label}
        </button>
      ))}
      <div className="tbtn-sep" />
      <button className="tbtn" title="Inline code" onClick={() => handleWrap('`')}>code</button>
      <button className="tbtn" title="Code block" onClick={handleCodeBlock}>```</button>
      <button className="tbtn" title="Insert link" onClick={handleLink}>🔗</button>
      <div className="tbtn-sep" />
      <button className="tbtn" title="Download .md" onClick={handleDownload}>↓ .md</button>
    </div>
  );
});

export default Toolbar;

const WRAP_BTNS = [
  { md: '**',  label: 'B',       title: 'Bold',        style: { fontWeight: 700 } },
  { md: '_',   label: 'I',       title: 'Italic',      style: { fontStyle: 'italic' } },
  { md: '~~',  label: 'S',       title: 'Strikethrough', style: { textDecoration: 'line-through' } },
];
const LINE_BTNS = [
  { prefix: '# ',  label: 'H1', title: 'Heading 1' },
  { prefix: '## ', label: 'H2', title: 'Heading 2' },
  { prefix: '### ',label: 'H3', title: 'Heading 3' },
  { prefix: '- ',  label: '• list', title: 'Bullet list' },
  { prefix: '1. ', label: '1. list', title: 'Ordered list' },
  { prefix: '> ',  label: '❝', title: 'Blockquote' },
];

function applyWrap(textarea, marker) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = marker + (sel || 'text') + marker;
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

function applyLinePrefix(textarea, prefix) {
  const { selectionStart: s, value } = textarea;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const current = value.slice(lineStart, s);
  if (current.startsWith(prefix)) {
    textarea.setRangeText('', lineStart, lineStart + prefix.length, 'end');
  } else {
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');
  }
  textarea.focus();
}

function applyCodeBlock(textarea) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = '```\n' + (sel || '') + '\n```';
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

function applyLink(textarea) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const sel = value.slice(s, e);
  const repl = '[' + (sel || 'text') + '](url)';
  textarea.setRangeText(repl, s, e, 'select');
  textarea.focus();
}

export default function Toolbar({ editorRef, onChange, activeFileId, fileTitle }) {
  const ed = () => editorRef.current;

  const handleWrap = (marker) => { applyWrap(ed(), marker); onChange(); };
  const handleLine = (prefix) => { applyLinePrefix(ed(), prefix); onChange(); };
  const handleCodeBlock = () => { applyCodeBlock(ed()); onChange(); };
  const handleLink = () => { applyLink(ed()); onChange(); };

  const handleDownload = () => {
    if (!activeFileId || !ed()) return;
    const blob = new Blob([ed().value], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (fileTitle || 'note') + '.md';
    a.click();
  };

  return (
    <div className="toolbar">
      {WRAP_BTNS.map(({ md, label, title, style }) => (
        <button key={md} className="tbtn" title={title} style={style} onClick={() => handleWrap(md)}>
          {label}
        </button>
      ))}
      <div className="tbtn-sep" />
      {LINE_BTNS.map(({ prefix, label, title }) => (
        <button key={prefix} className="tbtn" title={title} onClick={() => handleLine(prefix)}>
          {label}
        </button>
      ))}
      <div className="tbtn-sep" />
      <button className="tbtn" title="Inline code" onClick={() => handleWrap('`')}>code</button>
      <button className="tbtn" title="Code block" onClick={handleCodeBlock}>```</button>
      <button className="tbtn" title="Insert link" onClick={handleLink}>🔗</button>
      <div className="tbtn-sep" />
      <button className="tbtn" title="Download .md" onClick={handleDownload}>↓ .md</button>
    </div>
  );
}
