import type { ExportDirectory } from '../types/binary';
import { toHex32 } from '../utils/hexUtils';

interface ExportsTableProps {
  exports: ExportDirectory | null;
}

export function ExportsTable({ exports }: ExportsTableProps) {
  if (!exports || exports.entries.length === 0) {
    return (
      <div className="exports-table">
        <h3>📤 Exports</h3>
        <p className="empty-message">No exports found</p>
      </div>
    );
  }

  return (
    <div className="exports-table">
      <h3>📤 Exports — {exports.name} ({exports.entries.length} symbols)</h3>
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
