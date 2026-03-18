import type { BinaryFile } from '../types/binary';
import { toHex32, toHexBigInt, formatTimestamp, formatSize } from '../utils/hexUtils';
import { InfoPanel } from './InfoPanel';

interface SummaryViewProps {
  file: BinaryFile;
  fileSize: number;
  fileName: string;
}

export function SummaryView({ file, fileSize, fileName }: SummaryViewProps) {
  if (file.format === 'PE') {
    const { coffHeader, optionalHeader } = file;
    return (
      <div className="summary-view">
        <h3>📋 File Summary</h3>
        <InfoPanel title="Understanding Binary Headers">
          <p>This is the parsed header of a binary executable. When your OS loads
a program, it reads these headers first to understand the file.</p>
          <pre>{`PE File Layout (Windows):
┌──────────────────────────┐
│      DOS Header          │ ← "MZ" magic (backward compat)
│  (e_lfanew → PE offset)  │
├──────────────────────────┤
│      PE Signature        │ ← "PE\\0\\0"
├──────────────────────────┤
│     COFF Header          │ ← Machine type, # of sections
├──────────────────────────┤
│    Optional Header       │ ← Entry point, image base, subsystem
├──────────────────────────┤
│    Section Headers[]     │ ← .text, .data, .rdata, etc.
├──────────────────────────┤
│    Section Data          │ ← Actual code and data
└──────────────────────────┘

ELF File Layout (Linux):
┌──────────────────────────┐
│      ELF Header          │ ← "\\x7FELF" magic, arch, entry point
├──────────────────────────┤
│  Program Headers[]       │ ← How to load into memory
├──────────────────────────┤
│    Section Data          │ ← .text, .data, .rodata, etc.
├──────────────────────────┤
│  Section Headers[]       │ ← Metadata about each section
└──────────────────────────┘`}</pre>
          <p><strong>Key Fields:</strong></p>
          <p>• <strong>Architecture</strong> — CPU type (x86, x64, ARM64)</p>
          <p>• <strong>Entry Point</strong> — Address where execution begins</p>
          <p>• <strong>Image Base</strong> — Preferred load address in memory</p>
          <p>• <strong>Subsystem</strong> — Console app, GUI app, driver, etc.</p>
        </InfoPanel>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">File Name</span>
            <span className="summary-value">{fileName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Format</span>
            <span className="summary-value highlight">PE ({optionalHeader.magicStr})</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Architecture</span>
            <span className="summary-value highlight">{coffHeader.machineStr}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Entry Point</span>
            <span className="summary-value mono">0x{toHex32(optionalHeader.addressOfEntryPoint)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Image Base</span>
            <span className="summary-value mono">
              0x{toHexBigInt(optionalHeader.imageBase, optionalHeader.magic === 0x20b ? 16 : 8)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">File Size</span>
            <span className="summary-value">{formatSize(fileSize)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Timestamp</span>
            <span className="summary-value">{formatTimestamp(coffHeader.timeDateStamp)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Subsystem</span>
            <span className="summary-value">{optionalHeader.subsystemStr}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Sections</span>
            <span className="summary-value">{coffHeader.numberOfSections}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Section Alignment</span>
            <span className="summary-value mono">0x{toHex32(optionalHeader.sectionAlignment)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">File Alignment</span>
            <span className="summary-value mono">0x{toHex32(optionalHeader.fileAlignment)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Image Size</span>
            <span className="summary-value">{formatSize(optionalHeader.sizeOfImage)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Linker Version</span>
            <span className="summary-value">
              {optionalHeader.majorLinkerVersion}.{optionalHeader.minorLinkerVersion}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">OS Version</span>
            <span className="summary-value">
              {optionalHeader.majorOSVersion}.{optionalHeader.minorOSVersion}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Characteristics</span>
            <span className="summary-value mono">0x{toHex32(coffHeader.characteristics)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ELF
  const { header } = file;
  return (
    <div className="summary-view">
      <h3>📋 File Summary</h3>
      <InfoPanel title="Understanding Binary Headers">
        <p>This is the parsed header of a binary executable. When your OS loads
a program, it reads these headers first to understand the file.</p>
        <pre>{`PE File Layout (Windows):
┌──────────────────────────┐
│      DOS Header          │ ← "MZ" magic (backward compat)
│  (e_lfanew → PE offset)  │
├──────────────────────────┤
│      PE Signature        │ ← "PE\\0\\0"
├──────────────────────────┤
│     COFF Header          │ ← Machine type, # of sections
├──────────────────────────┤
│    Optional Header       │ ← Entry point, image base, subsystem
├──────────────────────────┤
│    Section Headers[]     │ ← .text, .data, .rdata, etc.
├──────────────────────────┤
│    Section Data          │ ← Actual code and data
└──────────────────────────┘

ELF File Layout (Linux):
┌──────────────────────────┐
│      ELF Header          │ ← "\\x7FELF" magic, arch, entry point
├──────────────────────────┤
│  Program Headers[]       │ ← How to load into memory
├──────────────────────────┤
│    Section Data          │ ← .text, .data, .rodata, etc.
├──────────────────────────┤
│  Section Headers[]       │ ← Metadata about each section
└──────────────────────────┘`}</pre>
        <p><strong>Key Fields:</strong></p>
        <p>• <strong>Architecture</strong> — CPU type (x86, x64, ARM64)</p>
        <p>• <strong>Entry Point</strong> — Address where execution begins</p>
        <p>• <strong>Image Base</strong> — Preferred load address in memory</p>
        <p>• <strong>Subsystem</strong> — Console app, GUI app, driver, etc.</p>
      </InfoPanel>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">File Name</span>
          <span className="summary-value">{fileName}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Format</span>
          <span className="summary-value highlight">ELF ({header.classStr})</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Type</span>
          <span className="summary-value">{header.typeStr}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Architecture</span>
          <span className="summary-value highlight">{header.machineStr}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Endianness</span>
          <span className="summary-value">{header.dataStr}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Entry Point</span>
          <span className="summary-value mono">0x{toHexBigInt(header.entryPoint, header.class === 2 ? 16 : 8)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">File Size</span>
          <span className="summary-value">{formatSize(fileSize)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Sections</span>
          <span className="summary-value">{header.shnum}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Program Headers</span>
          <span className="summary-value">{header.phnum}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Flags</span>
          <span className="summary-value mono">0x{header.flags.toString(16).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
