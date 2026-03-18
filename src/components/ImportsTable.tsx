import type { ImportEntry } from '../types/binary';

interface ImportsTableProps {
  imports: ImportEntry[];
}

export function ImportsTable({ imports }: ImportsTableProps) {
  if (imports.length === 0) {
    return (
      <div className="imports-table">
        <h3>📥 Imports</h3>
        <p className="empty-message">No imports found</p>
      </div>
    );
  }

  return (
    <div className="imports-table">
      <h3>📥 Imports ({imports.length} DLLs)</h3>
      <div className="imports-list">
        {imports.map((entry, i) => (
          <details key={i} className="import-group">
            <summary className="dll-name">
              {entry.dllName}
              <span className="function-count">{entry.functions.length} functions</span>
            </summary>
            <div className="import-functions">
              <table>
                <thead>
                  <tr>
                    <th>Hint</th>
                    <th>Function</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.functions.map((func, j) => (
                    <tr key={j}>
                      <td className="mono">{func.ordinal !== undefined ? `Ord ${func.ordinal}` : `0x${func.hint.toString(16).toUpperCase()}`}</td>
                      <td className="function-name">{func.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
