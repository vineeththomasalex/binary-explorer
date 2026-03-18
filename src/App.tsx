import { useState, useCallback } from 'react';
import './App.css';
import { DropZone } from './components/DropZone';
import { SummaryView } from './components/SummaryView';
import { SectionsTable } from './components/SectionsTable';
import { ImportsTable } from './components/ImportsTable';
import { ExportsTable } from './components/ExportsTable';
import { HexViewer } from './components/HexViewer';
import { StringsView } from './components/StringsView';
import { isPEFile, parsePE } from './utils/peParser';
import { isELFFile, parseELF } from './utils/elfParser';
import type { BinaryFile } from './types/binary';

type Tab = 'summary' | 'sections' | 'imports' | 'exports' | 'hex' | 'strings';

function App() {
  const [file, setFile] = useState<BinaryFile | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [hexOffset, setHexOffset] = useState<number | null>(null);

  const handleFileLoaded = useCallback((buf: ArrayBuffer, name: string) => {
    setError(null);
    setFileName(name);
    setBuffer(buf);
    setHexOffset(null);

    try {
      if (isPEFile(buf)) {
        setFile(parsePE(buf));
        setActiveTab('summary');
      } else if (isELFFile(buf)) {
        setFile(parseELF(buf));
        setActiveTab('summary');
      } else {
        setFile(null);
        setError('Unrecognized file format. Expected PE (MZ) or ELF header.');
      }
    } catch (e) {
      setFile(null);
      setError(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const handleSectionClick = useCallback((offset: number) => {
    setHexOffset(offset);
    setActiveTab('hex');
  }, []);

  const handleStringClick = useCallback((offset: number) => {
    setHexOffset(offset);
    setActiveTab('hex');
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setBuffer(null);
    setFileName('');
    setError(null);
    setActiveTab('summary');
    setHexOffset(null);
  }, []);

  const isPE = file?.format === 'PE';

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: 'summary', label: '📋 Summary' },
    { id: 'sections', label: '📦 Sections' },
    { id: 'imports', label: '📥 Imports', disabled: !isPE },
    { id: 'exports', label: '📤 Exports', disabled: !isPE },
    { id: 'hex', label: '🔍 Hex' },
    { id: 'strings', label: '🔤 Strings' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Binary Explorer 🔬</h1>
        <p className="subtitle">Client-side PE &amp; ELF binary inspector</p>
      </header>

      {!file && !error && <DropZone onFileLoaded={handleFileLoaded} />}

      {error && (
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button className="reset-btn" onClick={handleReset}>
            Load Another File
          </button>
        </div>
      )}

      {file && buffer && (
        <>
          <div className="toolbar">
            <span className="file-info">
              📄 <strong>{fileName}</strong> · {file.format}
              {file.format === 'PE' ? ` · ${file.coffHeader.machineStr}` : ` · ${file.header.machineStr}`}
            </span>
            <button className="reset-btn" onClick={handleReset}>
              ✕ Close
            </button>
          </div>

          <nav className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                disabled={tab.disabled}
                onClick={() => {
                  if (tab.id !== 'hex') setHexOffset(null);
                  setActiveTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="tab-content">
            {activeTab === 'summary' && (
              <SummaryView file={file} fileSize={buffer.byteLength} fileName={fileName} />
            )}
            {activeTab === 'sections' && (
              <SectionsTable file={file} onSectionClick={handleSectionClick} />
            )}
            {activeTab === 'imports' && file.format === 'PE' && (
              <ImportsTable imports={file.imports} />
            )}
            {activeTab === 'exports' && file.format === 'PE' && (
              <ExportsTable exports={file.exports} />
            )}
            {activeTab === 'hex' && (
              <HexViewer buffer={buffer} scrollToOffset={hexOffset} />
            )}
            {activeTab === 'strings' && (
              <StringsView buffer={buffer} onStringClick={handleStringClick} />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
