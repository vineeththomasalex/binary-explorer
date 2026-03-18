import type { BinaryFile, SectionHeader, ELFSection } from '../types/binary';
import { toHex32, toHexBigInt, formatSize } from '../utils/hexUtils';

interface SectionsTableProps {
  file: BinaryFile;
  onSectionClick?: (offset: number) => void;
}

export function SectionsTable({ file, onSectionClick }: SectionsTableProps) {
  if (file.format === 'PE') {
    return (
      <div className="sections-table">
        <h3>📦 Sections ({file.sections.length})</h3>
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
