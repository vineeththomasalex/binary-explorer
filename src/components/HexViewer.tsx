import React, { useState, useRef, useCallback, useEffect } from 'react';
import { formatOffset, isPrintableAscii, byteToAscii } from '../utils/hexUtils';
import { InfoPanel } from './InfoPanel';

interface HexViewerProps {
  buffer: ArrayBuffer;
  scrollToOffset?: number | null;
}

const BYTES_PER_ROW = 16;
const ROW_HEIGHT = 22;

export function HexViewer({ buffer, scrollToOffset }: HexViewerProps) {
  const bytes = new Uint8Array(buffer);
  const totalRows = Math.ceil(bytes.length / BYTES_PER_ROW);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scrollToOffset != null && containerRef.current) {
      const row = Math.floor(scrollToOffset / BYTES_PER_ROW);
      containerRef.current.scrollTop = row * ROW_HEIGHT;
    }
  }, [scrollToOffset]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const visibleRows = Math.ceil(containerHeight / ROW_HEIGHT) + 2;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 1);
  const endRow = Math.min(totalRows, startRow + visibleRows);

  const rows = [];
  for (let row = startRow; row < endRow; row++) {
    const offset = row * BYTES_PER_ROW;
    const rowBytes: number[] = [];
    for (let col = 0; col < BYTES_PER_ROW; col++) {
      const idx = offset + col;
      rowBytes.push(idx < bytes.length ? bytes[idx] : -1);
    }

    const hexParts: React.ReactNode[] = [];
    const asciiParts: React.ReactNode[] = [];

    for (let col = 0; col < BYTES_PER_ROW; col++) {
      const b = rowBytes[col];
      if (col === 8) {
        hexParts.push(<span key="sep" className="hex-separator"> </span>);
      }
      if (b === -1) {
        hexParts.push(<span key={col} className="hex-byte empty">   </span>);
        asciiParts.push(<span key={col} className="ascii-char empty"> </span>);
      } else {
        const hexStr = b.toString(16).toUpperCase().padStart(2, '0');
        const printable = isPrintableAscii(b);
        hexParts.push(
          <span key={col} className={`hex-byte ${printable ? 'printable' : 'non-printable'}`}>
            {hexStr}{' '}
          </span>
        );
        asciiParts.push(
          <span key={col} className={`ascii-char ${printable ? 'printable' : 'non-printable'}`}>
            {byteToAscii(b)}
          </span>
        );
      }
    }

    rows.push(
      <div
        key={row}
        className="hex-row"
        style={{
          position: 'absolute',
          top: row * ROW_HEIGHT,
          height: ROW_HEIGHT,
        }}
      >
        <span className="hex-offset">{formatOffset(offset)}</span>
        <span className="hex-bytes">{hexParts}</span>
        <span className="hex-ascii">|{asciiParts}|</span>
      </div>
    );
  }

  return (
    <div className="hex-viewer">
      <h3>🔍 Hex Viewer</h3>
      <InfoPanel title="Reading Hex Data">
        <p>The hex viewer shows the raw bytes of the file. Each row displays
16 bytes in hexadecimal alongside their ASCII representation.</p>
        <pre>{`Reading Hex:
  OFFSET    HEX BYTES (16 per row)                    ASCII
  00000000  4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00  |MZ..............|
            ^^                                                  ^^
            Each pair = 1 byte (00-FF = 0-255)                  Printable chars
                                                                '.' = non-printable

Endianness (byte order):
• x86/x64 use Little-Endian: bytes are stored least-significant first
• The value 0x00004550 ("PE\\0\\0") is stored as: 50 45 00 00
• Address 0x00012000 is stored as: 00 20 01 00

Common Magic Numbers:
• 4D 5A        — "MZ" (PE/DOS executable)
• 7F 45 4C 46  — "\\x7FELF" (ELF executable)
• 50 45 00 00  — "PE\\0\\0" (PE signature)
• CA FE BA BE  — Mach-O / Java class file`}</pre>
        <p>Click a section in the Sections tab to jump to its offset here.</p>
      </InfoPanel>
      <div className="hex-info">
        {bytes.length.toLocaleString()} bytes total · {totalRows.toLocaleString()} rows
      </div>
      <div
        className="hex-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div
          className="hex-content"
          style={{ height: totalRows * ROW_HEIGHT }}
        >
          {rows}
        </div>
      </div>
    </div>
  );
}
