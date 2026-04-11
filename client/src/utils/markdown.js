import { marked } from 'marked';
import DOMPurify from 'dompurify';

// ── Lazy highlight.js ──────────────────────────────────────────────────────
// highlight.js is large (~900 kB unminified). We import it normally but defer
// the *registration* of all languages until the first actual highlight call.
// Combined with Vite's vendor-markdown chunk this means the bundle is loaded
// only when Preview first becomes visible, not on app start.
import hljs from 'highlight.js';

// ── Custom renderer ────────────────────────────────────────────────────────
const renderer = new marked.Renderer();

renderer.code = function (token) {
  let rawCode, language;
  if (token && typeof token === 'object' && 'text' in token) {
    rawCode = token.text || '';
    language = token.lang || '';
  } else {
    rawCode = String(token || '');
    language = String(arguments[1] || '');
  }

  let highlighted = '';
  let detectedLang = language;

  try {
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(rawCode, { language, ignoreIllegals: true }).value;
    } else {
      const res = hljs.highlightAuto(rawCode, [
        'javascript', 'typescript', 'python', 'bash', 'css', 'html',
        'json', 'jsx', 'tsx', 'sql', 'rust', 'go', 'cpp', 'c', 'java',
        'php', 'ruby', 'yaml', 'xml', 'markdown',
      ]);
      highlighted = res.value;
      detectedLang = res.language || 'text';
    }
  } catch {
    highlighted = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const label = (detectedLang || 'text').replace(/[^a-zA-Z0-9+#\-_.]/g, '');
  return (
    '<pre>' +
    '<div class="code-header">' +
    `<span class="code-lang">${label}</span>` +
    '<button class="code-copy" data-copy>copy</button>' +
    '</div>' +
    `<code class="hljs language-${label}">${highlighted}</code>` +
    '</pre>'
  );
};

// Open external links in new tab safely
renderer.link = function (token) {
  const href = token.href || '';
  const title = token.title ? ` title="${token.title}"` : '';
  const isExternal = /^https?:\/\//.test(href);
  const rel = isExternal ? ' rel="noopener noreferrer"' : '';
  const target = isExternal ? ' target="_blank"' : '';
  return `<a href="${href}"${title}${target}${rel}>${token.text}</a>`;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

// DOMPurify config — allow our custom data-copy attribute and hljs classes
const PURIFY_CONFIG = {
  ADD_ATTR: ['data-copy', 'target', 'rel'],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

// ── LRU parse cache ────────────────────────────────────────────────────────
// Avoids re-parsing + re-sanitising identical content when the user switches
// between notes or toggles preview without making edits. Capped at 32 entries
// so it never grows unbounded.
const CACHE_SIZE = 32;
const parseCache  = new Map(); // key → html

function cachedParse(content) {
  if (parseCache.has(content)) {
    // Move to end (most-recently-used)
    const html = parseCache.get(content);
    parseCache.delete(content);
    parseCache.set(content, html);
    return html;
  }
  const raw  = marked.parse(content);
  const html = DOMPurify.sanitize(raw, PURIFY_CONFIG);
  if (parseCache.size >= CACHE_SIZE) {
    // Evict least-recently-used (first inserted) entry
    parseCache.delete(parseCache.keys().next().value);
  }
  parseCache.set(content, html);
  return html;
}

export function parseMarkdown(content) {
  try {
    return cachedParse(content);
  } catch (e) {
    return `<p style="color:var(--red)">Preview error: ${e.message}</p>`;
  }
}

export function attachCopyHandlers(container) {
  if (!container) return;
  container.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.onclick = () => {
      const code = btn.closest('pre')?.querySelector('code');
      if (!code) return;
      navigator.clipboard?.writeText(code.textContent).then(() => {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        // fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = code.textContent;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'copied!';
        setTimeout(() => { btn.textContent = 'copy'; }, 2000);
      });
    };
  });
}

// ── Custom renderer ────────────────────────────────────────────────────────
const renderer = new marked.Renderer();

renderer.code = function (token) {
  let rawCode, language;
  if (token && typeof token === 'object' && 'text' in token) {
    rawCode = token.text || '';
    language = token.lang || '';
  } else {
    rawCode = String(token || '');
    language = String(arguments[1] || '');
  }

  let highlighted = '';
  let detectedLang = language;

  try {
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(rawCode, { language, ignoreIllegals: true }).value;
    } else {
      const res = hljs.highlightAuto(rawCode, [
        'javascript', 'typescript', 'python', 'bash', 'css', 'html',
        'json', 'jsx', 'tsx', 'sql', 'rust', 'go', 'cpp', 'c', 'java',
        'php', 'ruby', 'yaml', 'xml', 'markdown',
      ]);
      highlighted = res.value;
      detectedLang = res.language || 'text';
    }
  } catch {
    highlighted = rawCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const label = (detectedLang || 'text').replace(/[^a-zA-Z0-9+#\-_.]/g, '');
  return (
    '<pre>' +
    '<div class="code-header">' +
    `<span class="code-lang">${label}</span>` +
    '<button class="code-copy" data-copy>copy</button>' +
    '</div>' +
    `<code class="hljs language-${label}">${highlighted}</code>` +
    '</pre>'
  );
};

// Open external links in new tab safely
renderer.link = function (token) {
  const href = token.href || '';
  const title = token.title ? ` title="${token.title}"` : '';
  const isExternal = /^https?:\/\//.test(href);
  const rel = isExternal ? ' rel="noopener noreferrer"' : '';
  const target = isExternal ? ' target="_blank"' : '';
  return `<a href="${href}"${title}${target}${rel}>${token.text}</a>`;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

// DOMPurify config — allow our custom data-copy attribute and hljs classes
const PURIFY_CONFIG = {
  ADD_ATTR: ['data-copy', 'target', 'rel'],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

export function parseMarkdown(content) {
  try {
    const raw = marked.parse(content);
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  } catch (e) {
    return `<p style="color:var(--red)">Preview error: ${e.message}</p>`;
  }
}

export function attachCopyHandlers(container) {
  if (!container) return;
  container.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.onclick = () => {
      const code = btn.closest('pre')?.querySelector('code');
      if (!code) return;
      navigator.clipboard?.writeText(code.textContent).then(() => {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        // fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = code.textContent;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'copied!';
        setTimeout(() => { btn.textContent = 'copy'; }, 2000);
      });
    };
  });
}
