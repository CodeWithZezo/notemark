import React, { useEffect, useRef, useState } from 'react';

export default function Modal({ show, title, placeholder, okLabel = 'Create', onOk, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [show]);

  const handleOk = () => {
    if (value.trim()) { onOk(value.trim()); setValue(''); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleOk();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className={`modal-overlay${show ? ' show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal">
        <h3>{title}</h3>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
        />
        <div className="modal-btns">
          <button className="mbtn" onClick={onCancel}>Cancel</button>
          <button className="mbtn ok" onClick={handleOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}
