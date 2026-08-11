import { useRef, useState } from 'react';

export default function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="cursor-pointer rounded-2xl p-10 text-center transition-all"
      style={{
        border: `2px dashed ${dragging ? 'var(--jm-pink)' : 'rgba(255,255,255,0.15)'}`,
        background: dragging ? 'rgba(232,25,106,0.06)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <div className="text-5xl mb-4">📸</div>
      <p className="text-base font-bold text-white">Kies je Surfr-foto</p>
      <p className="text-sm mt-1" style={{ color: 'var(--jm-muted)' }}>
        We lezen hoogte, vliegtijd en afstand er zelf uit
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--jm-muted)' }}>
        Tik om te kiezen, of sleep hem hierheen — JPEG of PNG, max 5MB
      </p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  );
}
