import React, { useEffect, useRef } from 'react';
import { parseMarkdown, attachCopyHandlers } from '../utils/markdown';

// Debounce preview rendering — avoids re-parsing markdown on every keystroke.
// When the user is actively typing we wait 300 ms after the last change before
// updating the DOM, which eliminates expensive hljs work during fast input.
export default function Preview({ content, visible }) {
  const ref        = useRef(null);
  const timerRef   = useRef(null);
  const lastRef    = useRef(null); // last content rendered — skip no-op updates

  useEffect(() => {
    if (!visible) return;

    // Immediately render if transitioning from hidden → visible so there's no
    // flash of stale content, then let the debounce take over for edits.
    const render = () => {
      if (!ref.current || lastRef.current === content) return;
      lastRef.current = content;
      ref.current.innerHTML = parseMarkdown(content);
      attachCopyHandlers(ref.current);
    };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(render, 300);

    return () => clearTimeout(timerRef.current);
  }, [content, visible]);

  // When switching TO preview mode render immediately (no debounce delay)
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current && ref.current && lastRef.current !== content) {
      clearTimeout(timerRef.current);
      lastRef.current = content;
      ref.current.innerHTML = parseMarkdown(content);
      attachCopyHandlers(ref.current);
    }
    prevVisible.current = visible;
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className={`preview${visible ? ' visible' : ''}`} />;
}
