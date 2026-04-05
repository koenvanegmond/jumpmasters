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
      className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
        dragging ? 'border-jm-pink bg-pink-50' : 'border-gray-300 hover:border-jm-pink hover:bg-pink-50'
      }`}
    >
      <div className="text-5xl mb-4">📸</div>
      <p className="text-lg font-bold text-gray-800">Sleep je Surfr-screenshot hierheen</p>
      <p className="text-sm text-gray-400 mt-1">of klik om te bladeren — JPEG / PNG, max 5MB</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  );
}
