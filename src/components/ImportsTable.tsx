import type { ImportEntry } from '../types/binary';
import { InfoPanel } from './InfoPanel';

interface ImportsTableProps {
  imports: ImportEntry[];
}

export function ImportsTable({ imports }: ImportsTableProps) {
  if (imports.length === 0) {
    return (
      <div className="imports-table">
        <h3>📥 Imports</h3>
        <InfoPanel title="Understanding Imports">
          <p>Imports list the external functions this binary needs from other
DLLs (Dynamic Link Libraries). The OS resolves these at load time.</p>
          <pre>{`How Importing Works:
┌─────────────┐    load time     ┌─────────────┐
│  your.exe   │ ──────────────→  │ kernel32.dll │
│             │  "I need         │              │
│ CreateFile  │   CreateFile()"  │ CreateFile() │ ← actual code
│ ReadFile    │                  │ ReadFile()   │
│ CloseHandle │                  │ CloseHandle()│
└─────────────┘                  └──────────────┘

PE Import Table Structure:
Import Directory → list of DLL descriptors
  └→ Each DLL has an Import Lookup Table (ILT)
       └→ Each entry points to a function name or ordinal`}</pre>
          <p><strong>Common DLLs:</strong></p>
          <p>• <strong>kernel32.dll</strong> — File I/O, memory, processes, threads</p>
          <p>• <strong>user32.dll</strong> — Windows, messages, UI</p>
          <p>• <strong>ntdll.dll</strong> — Low-level NT kernel interface</p>
          <p>• <strong>msvcrt.dll</strong> — C runtime (printf, malloc, etc.)</p>
          <p>• <strong>advapi32.dll</strong> — Registry, security, services</p>
        </InfoPanel>
        <p className="empty-message">No imports found</p>
      </div>
    );
  }

  return (
    <div className="imports-table">
      <h3>📥 Imports ({imports.length} DLLs)</h3>
      <InfoPanel title="Understanding Imports">
        <p>Imports list the external functions this binary needs from other
DLLs (Dynamic Link Libraries). The OS resolves these at load time.</p>
        <pre>{`How Importing Works:
┌─────────────┐    load time     ┌─────────────┐
│  your.exe   │ ──────────────→  │ kernel32.dll │
│             │  "I need         │              │
│ CreateFile  │   CreateFile()"  │ CreateFile() │ ← actual code
│ ReadFile    │                  │ ReadFile()   │
│ CloseHandle │                  │ CloseHandle()│
└─────────────┘                  └──────────────┘

PE Import Table Structure:
Import Directory → list of DLL descriptors
  └→ Each DLL has an Import Lookup Table (ILT)
       └→ Each entry points to a function name or ordinal`}</pre>
        <p><strong>Common DLLs:</strong></p>
        <p>• <strong>kernel32.dll</strong> — File I/O, memory, processes, threads</p>
        <p>• <strong>user32.dll</strong> — Windows, messages, UI</p>
        <p>• <strong>ntdll.dll</strong> — Low-level NT kernel interface</p>
        <p>• <strong>msvcrt.dll</strong> — C runtime (printf, malloc, etc.)</p>
        <p>• <strong>advapi32.dll</strong> — Registry, security, services</p>
      </InfoPanel>
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
