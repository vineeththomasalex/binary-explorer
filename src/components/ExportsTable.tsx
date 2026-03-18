import type { ExportDirectory } from '../types/binary';
import { toHex32 } from '../utils/hexUtils';
import { InfoPanel } from './InfoPanel';

interface ExportsTableProps {
  exports: ExportDirectory | null;
}

export function ExportsTable({ exports }: ExportsTableProps) {
  if (!exports || exports.entries.length === 0) {
    return (
      <div className="exports-table">
        <h3>📤 Exports</h3>
        <InfoPanel title="Understanding Exports">
          <p>Exports are functions or symbols that a DLL makes available for
other programs to import. Most .exe files don't export anything.</p>
          <pre>{`Export Table Structure:
┌───────────────────────┐
│   Export Directory     │
│  ┌─────────────────┐  │
│  │ DLL Name        │──│──→ "mylib.dll"
│  │ # of Functions  │  │
│  │ # of Names      │  │
│  │ Ordinal Base    │  │
│  └─────────────────┘  │
│                       │
│  Address Table[]  ────│──→ RVAs of exported functions
│  Name Table[]     ────│──→ Function name strings
│  Ordinal Table[]  ────│──→ Maps names to addresses
└───────────────────────┘`}</pre>
          <p><strong>Ordinal vs Named Exports:</strong></p>
          <p>• <strong>Named</strong> — Imported by function name (most common)</p>
          <p>• <strong>Ordinal</strong> — Imported by number (slightly faster, less readable)</p>
        </InfoPanel>
        <p className="empty-message">No exports found</p>
      </div>
    );
  }

  return (
    <div className="exports-table">
      <h3>📤 Exports — {exports.name} ({exports.entries.length} symbols)</h3>
      <InfoPanel title="Understanding Exports">
        <p>Exports are functions or symbols that a DLL makes available for
other programs to import. Most .exe files don't export anything.</p>
        <pre>{`Export Table Structure:
┌───────────────────────┐
│   Export Directory     │
│  ┌─────────────────┐  │
│  │ DLL Name        │──│──→ "mylib.dll"
│  │ # of Functions  │  │
│  │ # of Names      │  │
│  │ Ordinal Base    │  │
│  └─────────────────┘  │
│                       │
│  Address Table[]  ────│──→ RVAs of exported functions
│  Name Table[]     ────│──→ Function name strings
│  Ordinal Table[]  ────│──→ Maps names to addresses
└───────────────────────┘`}</pre>
        <p><strong>Ordinal vs Named Exports:</strong></p>
        <p>• <strong>Named</strong> — Imported by function name (most common)</p>
        <p>• <strong>Ordinal</strong> — Imported by number (slightly faster, less readable)</p>
      </InfoPanel>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ordinal</th>
              <th>RVA</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {exports.entries.map((entry, i) => (
              <tr key={i}>
                <td className="mono">{entry.ordinal}</td>
                <td className="mono">0x{toHex32(entry.rva)}</td>
                <td className="function-name">{entry.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
