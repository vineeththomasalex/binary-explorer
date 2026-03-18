import { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
}

export function DropZone({ onFileLoaded }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileLoaded(reader.result, file.name);
        }
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsArrayBuffer(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.exe,.dll,.so,.elf,.o,.sys,.drv,.bin';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <div className="drop-zone-content">
        <div className="drop-icon">📂</div>
        <h2>Drop a binary file here</h2>
        <p>or click to browse</p>
        <p className="drop-hint">
          Supports PE (.exe, .dll, .sys) and ELF (.so, .elf, .o) files
        </p>
        {error && <p className="drop-error">{error}</p>}
      </div>
    </div>
  );
}
