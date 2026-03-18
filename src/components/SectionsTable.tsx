import type { BinaryFile, SectionHeader, ELFSection } from '../types/binary';
import { toHex32, toHexBigInt, formatSize } from '../utils/hexUtils';
import { InfoPanel } from './InfoPanel';

interface SectionsTableProps {
  file: BinaryFile;
  onSectionClick?: (offset: number) => void;
}

export function SectionsTable({ file, onSectionClick }: SectionsTableProps) {
  if (file.format === 'PE') {
    return (
      <div className="sections-table">
        <h3>📦 Sections ({file.sections.length})</h3>
        <InfoPanel title="Understanding Binary Sections">
          <p>Sections divide the binary into logical regions. Each section has
permissions (read/write/execute) that the OS enforces.</p>
          <pre>{`Common PE Sections:
┌───────────┬─────────────────────────────────────────┐
│ .text     │ Executable code (machine instructions)  │
│ .data     │ Initialized global/static variables     │
│ .rdata    │ Read-only data (strings, constants)     │
│ .bss      │ Uninitialized data (zero-filled)        │
│ .idata    │ Import tables (DLL references)          │
│ .edata    │ Export tables (shared symbols)           │
│ .rsrc     │ Resources (icons, dialogs, version)     │
│ .reloc    │ Relocation fixups for ASLR              │
│ .pdata    │ Exception handling data                 │
└───────────┴─────────────────────────────────────────┘`}</pre>
          <p><strong>Virtual Address vs Raw Offset:</strong></p>
          <p>• <strong>Virtual Address</strong> — Where the section lives in memory after loading</p>
          <p>• <strong>Raw Offset</strong> — Where the section lives in the file on disk</p>
          <p>• The OS maps file offsets → virtual addresses when loading</p>
          <p>Click any section to jump to its hex dump.</p>
        </InfoPanel>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Virtual Address</th>
                <th>Virtual Size</th>
                <th>Raw Offset</th>
                <th>Raw Size</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {file.sections.map((section: SectionHeader, i: number) => (
                <tr
                  key={i}
                  className="clickable-row"
                  onClick={() => onSectionClick?.(section.pointerToRawData)}
                >
                  <td>{i}</td>
                  <td className="section-name">{section.name}</td>
                  <td className="mono">0x{toHex32(section.virtualAddress)}</td>
                  <td className="mono">{formatSize(section.virtualSize)}</td>
                  <td className="mono">0x{toHex32(section.pointerToRawData)}</td>
                  <td className="mono">{formatSize(section.sizeOfRawData)}</td>
                  <td className="flags">
                    {section.characteristicsStr.map((flag) => (
                      <span key={flag} className="flag-badge">{flag}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ELF
  return (
    <div className="sections-table">
      <h3>📦 Sections ({file.sections.length})</h3>
      <InfoPanel title="Understanding Binary Sections">
        <p>Sections divide the binary into logical regions. Each section has
permissions (read/write/execute) that the OS enforces.</p>
        <pre>{`Common PE Sections:
┌───────────┬─────────────────────────────────────────┐
│ .text     │ Executable code (machine instructions)  │
│ .data     │ Initialized global/static variables     │
│ .rdata    │ Read-only data (strings, constants)     │
│ .bss      │ Uninitialized data (zero-filled)        │
│ .idata    │ Import tables (DLL references)          │
│ .edata    │ Export tables (shared symbols)           │
│ .rsrc     │ Resources (icons, dialogs, version)     │
│ .reloc    │ Relocation fixups for ASLR              │
│ .pdata    │ Exception handling data                 │
└───────────┴─────────────────────────────────────────┘`}</pre>
        <p><strong>Virtual Address vs Raw Offset:</strong></p>
        <p>• <strong>Virtual Address</strong> — Where the section lives in memory after loading</p>
        <p>• <strong>Raw Offset</strong> — Where the section lives in the file on disk</p>
        <p>• The OS maps file offsets → virtual addresses when loading</p>
        <p>Click any section to jump to its hex dump.</p>
      </InfoPanel>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>Offset</th>
              <th>Size</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {file.sections.map((section: ELFSection, i: number) => (
              <tr
                key={i}
                className="clickable-row"
                onClick={() => onSectionClick?.(Number(section.offset))}
              >
                <td>{i}</td>
                <td className="section-name">{section.name || '(none)'}</td>
                <td>{section.typeStr}</td>
                <td className="mono">0x{toHexBigInt(section.addr, 8)}</td>
                <td className="mono">0x{toHexBigInt(section.offset, 8)}</td>
                <td className="mono">{formatSize(Number(section.size))}</td>
                <td className="flags">
                  {section.flagsStr.map((flag) => (
                    <span key={flag} className="flag-badge">{flag}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
