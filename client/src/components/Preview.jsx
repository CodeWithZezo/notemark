import React, { useEffect, useRef } from 'react';
import { parseMarkdown, attachCopyHandlers } from '../utils/markdown';

export default function Preview({ content, visible }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!visible || !ref.current) return;
    ref.current.innerHTML = parseMarkdown(content);
    attachCopyHandlers(ref.current);
  }, [content, visible]);

  return <div ref={ref} className={`preview${visible ? ' visible' : ''}`} />;
}
