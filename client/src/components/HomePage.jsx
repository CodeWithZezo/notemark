import React, { useEffect, useRef, useState } from 'react';

// ── Animated typing effect for the hero ──────────────────────────────────
function TypeWriter({ strings, speed = 60, pause = 1800 }) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx]         = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = strings[idx];
    const delay = deleting ? speed / 2 : speed;

    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplay(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setTimeout(() => setDeleting(true), pause);
        }
      } else {
        if (charIdx > 0) {
          setDisplay(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        } else {
          setDeleting(false);
          setIdx((i) => (i + 1) % strings.length);
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [charIdx, deleting, idx, strings, speed, pause]);

  return (
    <span className="hp-typewriter">
      {display}
      <span className="hp-cursor" aria-hidden="true">|</span>
    </span>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="hp-feature-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms`,
      }}
    >
      <div className="hp-feature-icon" aria-hidden="true">{icon}</div>
      <h3 className="hp-feature-title">{title}</h3>
      <p className="hp-feature-desc">{description}</p>
    </div>
  );
}

// ── Keyboard shortcut badge ───────────────────────────────────────────────
function Kbd({ children }) {
  return <kbd className="hp-kbd">{children}</kbd>;
}

// ── Main HomePage ─────────────────────────────────────────────────────────
export default function HomePage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      title: 'Markdown-First Editor',
      description: 'Write in clean, distraction-free Markdown with live preview, syntax highlighting, and full formatting toolbar. Your notes render beautifully every time.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Organised File Tree',
      description: 'Structure your knowledge with nested folders, drag-and-drop reordering, inline renaming, and a right-click context menu — just like a real IDE.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      title: 'Auto-Save, Always',
      description: 'Every keystroke is debounce-saved to the cloud within 1.5 seconds. Manual save with Ctrl+S when you need it. Never lose a thought again.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      ),
      title: 'Private by Architecture',
      description: 'Row Level Security enforced at the Postgres layer — not just application code. Your data is mathematically inaccessible to other users, even with the same API key.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
      title: 'Instant Full-Text Search',
      description: 'Jump to any note instantly with Ctrl+F. Results surface as you type across all your notes and folder names — no indexing delay, no waiting.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      ),
      title: 'Responsive on Every Device',
      description: 'Collapsible sidebar, touch-friendly controls, and safe-area inset support. Whether you are on a 27-inch monitor or an iPhone, notemark adapts.',
    },
  ];

  return (
    <div className="hp-root">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className={`hp-nav ${scrolled ? 'hp-nav--scrolled' : ''}`}>
        <div className="hp-nav-inner">
          <div className="hp-nav-logo" aria-label="notemark">
            note<span className="hp-logo-glyph">■</span>mark
          </div>
          <nav className="hp-nav-links" aria-label="Primary">
            <a href="#features" className="hp-nav-link">Features</a>
            <a href="#how-it-works" className="hp-nav-link">How it works</a>
            <a href="#stack" className="hp-nav-link">Stack</a>
          </nav>
          <button className="hp-nav-cta" onClick={onGetStarted}>
            Sign in
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hp-hero" aria-labelledby="hero-heading">
        <div className="hp-hero-glow" aria-hidden="true" />
        <div className="hp-hero-grid" aria-hidden="true" />

        <div className="hp-hero-inner">
          <div className="hp-hero-badge">
            <span className="hp-badge-dot" aria-hidden="true" />
            Powered by Supabase · No server required
          </div>

          <h1 id="hero-heading" className="hp-hero-h1">
            The notes app built for<br />
            <TypeWriter
              strings={['developers.', 'writers.', 'researchers.', 'thinkers.']}
              speed={65}
              pause={2000}
            />
          </h1>

          <p className="hp-hero-sub">
            notemark is a keyboard-driven Markdown editor with cloud sync, structured
            file organisation, and database-layer privacy — all without a backend server.
          </p>

          <div className="hp-hero-actions">
            <button className="hp-btn-primary" onClick={onGetStarted}>
              Get started free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <a href="#features" className="hp-btn-ghost">
              See features
            </a>
          </div>

          {/* ── Editor preview mockup ────────────────────────────── */}
          <div className="hp-preview-wrap" aria-hidden="true">
            <div className="hp-preview-chrome">
              <div className="hp-chrome-dots">
                <span /><span /><span />
              </div>
              <div className="hp-chrome-title">note■mark — meeting-notes.md</div>
            </div>
            <div className="hp-preview-body">
              <div className="hp-preview-sidebar">
                <div className="hp-tree-folder">
                  <span className="hp-tree-icon">▾</span> Work
                </div>
                <div className="hp-tree-item hp-tree-active">
                  <span className="hp-tree-icon">◆</span> meeting-notes.md
                </div>
                <div className="hp-tree-item">
                  <span className="hp-tree-icon">◆</span> roadmap.md
                </div>
                <div className="hp-tree-folder" style={{ marginTop: 8 }}>
                  <span className="hp-tree-icon">▸</span> Personal
                </div>
              </div>
              <div className="hp-preview-editor">
                <div className="hp-code-line"><span className="hp-md-h1"># Q2 Planning</span></div>
                <div className="hp-code-line hp-code-blank" />
                <div className="hp-code-line"><span className="hp-md-h2">## Agenda</span></div>
                <div className="hp-code-line"><span className="hp-md-li">- Review sprint velocity</span></div>
                <div className="hp-code-line"><span className="hp-md-li">- Define <span className="hp-md-bold">OKRs</span> for Q3</span></div>
                <div className="hp-code-line"><span className="hp-md-li">- Discuss <span className="hp-md-code">`release/2.0`</span> scope</span></div>
                <div className="hp-code-line hp-code-blank" />
                <div className="hp-code-line"><span className="hp-md-h2">## Notes</span></div>
                <div className="hp-code-line"><span className="hp-md-p">Velocity increased by <span className="hp-md-bold">18%</span> this quarter,</span></div>
                <div className="hp-code-line"><span className="hp-md-p">primarily driven by infra improvements.</span></div>
                <div className="hp-code-line hp-cursor-line">
                  <span className="hp-md-p">Next steps: ship </span><span className="hp-preview-caret" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="hp-section" aria-labelledby="features-heading">
        <div className="hp-section-inner">
          <div className="hp-section-label">Capabilities</div>
          <h2 id="features-heading" className="hp-section-h2">
            Everything you need.<br />Nothing you don&rsquo;t.
          </h2>
          <p className="hp-section-sub">
            notemark is intentionally minimal — every feature earns its place by making
            you a faster, more focused writer and thinker.
          </p>
          <div className="hp-features-grid">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyboard shortcuts ─────────────────────────────────────────── */}
      <section id="how-it-works" className="hp-section hp-section--alt" aria-labelledby="shortcuts-heading">
        <div className="hp-section-inner hp-shortcuts-wrap">
          <div className="hp-shortcuts-text">
            <div className="hp-section-label">Keyboard-first</div>
            <h2 id="shortcuts-heading" className="hp-section-h2 hp-section-h2--left">
              Your hands never<br />leave the keyboard.
            </h2>
            <p className="hp-section-sub hp-section-sub--left">
              notemark is designed around muscle memory. Every core action has a
              shortcut — so you stay in flow, not in menus.
            </p>
          </div>
          <div className="hp-shortcuts-table" role="table" aria-label="Keyboard shortcuts">
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>S</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Save note immediately</div>
            </div>
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>P</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Toggle preview mode</div>
            </div>
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>B</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Toggle sidebar</div>
            </div>
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>F</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Search all notes</div>
            </div>
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>B</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Bold selected text</div>
            </div>
            <div className="hp-shortcut-row" role="row">
              <div role="cell"><Kbd>Ctrl</Kbd><span className="hp-kbd-plus">+</span><Kbd>I</Kbd></div>
              <div role="cell" className="hp-shortcut-label">Italicise selected text</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech stack ─────────────────────────────────────────────────── */}
      <section id="stack" className="hp-section" aria-labelledby="stack-heading">
        <div className="hp-section-inner">
          <div className="hp-section-label">Architecture</div>
          <h2 id="stack-heading" className="hp-section-h2">
            Thoughtfully engineered,<br />openly simple.
          </h2>
          <p className="hp-section-sub">
            The entire stack is open and auditable. No proprietary lock-in, no black boxes.
            Bring your own Supabase project and own your data completely.
          </p>

          <div className="hp-stack-grid">
            {[
              { layer: 'Frontend', tech: 'React 18 + Vite', note: 'Fast dev experience, optimised production builds.' },
              { layer: 'Auth', tech: 'Supabase Auth', note: 'Email/password, Google, and GitHub OAuth out of the box.' },
              { layer: 'Database', tech: 'Supabase Postgres', note: 'JSONB note state per user, fully normalised schema.' },
              { layer: 'Security', tech: 'Row Level Security', note: 'Isolation enforced at the database layer — not application code.' },
              { layer: 'Markdown', tech: 'marked + highlight.js', note: 'Fast rendering, 190+ syntax themes, XSS-safe via DOMPurify.' },
              { layer: 'Deployment', tech: 'Any static host', note: 'Netlify, Vercel, Cloudflare Pages — zero server configuration.' },
            ].map(({ layer, tech, note }) => (
              <div className="hp-stack-card" key={layer}>
                <div className="hp-stack-layer">{layer}</div>
                <div className="hp-stack-tech">{tech}</div>
                <div className="hp-stack-note">{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────────── */}
      <section className="hp-cta-section" aria-labelledby="cta-heading">
        <div className="hp-cta-glow" aria-hidden="true" />
        <div className="hp-cta-inner">
          <h2 id="cta-heading" className="hp-cta-h2">
            Your notes. Your data.<br />Your control.
          </h2>
          <p className="hp-cta-sub">
            Create a free account and start writing in under two minutes.
            No credit card. No tracking. No noise.
          </p>
          <button className="hp-btn-primary hp-btn-primary--large" onClick={onGetStarted}>
            Open notemark
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-logo" aria-label="notemark">
            note<span className="hp-logo-glyph">■</span>mark
          </div>
          <p className="hp-footer-tagline">
            A keyboard-driven Markdown notes app powered by Supabase.
          </p>
          <p className="hp-footer-copy">
            Open source · MIT licence · No tracking
          </p>
        </div>
      </footer>
    </div>
  );
}
