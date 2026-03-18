import { useState } from 'react';

interface InfoPanelProps {
  title: string;
  children: React.ReactNode;
}

export function InfoPanel({ title, children }: InfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="info-panel">
      <button
        className={`info-panel-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'ℹ️ Hide info' : 'ℹ️ What is this?'}
      </button>
      {isOpen && (
        <div className="info-panel-content">
          <div className="info-panel-title">{title}</div>
          {children}
        </div>
      )}
    </div>
  );
}
