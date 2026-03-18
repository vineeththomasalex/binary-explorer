import { useState, useMemo } from 'react';
import type { ExtractedString } from '../types/binary';
import { extractStrings } from '../utils/stringExtractor';
import { toHex32 } from '../utils/hexUtils';
import { InfoPanel } from './InfoPanel';

interface StringsViewProps {
  buffer: ArrayBuffer;
  onStringClick?: (offset: number) => void;
}

const PAGE_SIZE = 100;

export function StringsView({ buffer, onStringClick }: StringsViewProps) {
  const [minLength, setMinLength] = useState(4);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);

  const allStrings = useMemo(
    () => extractStrings(buffer, minLength),
    [buffer, minLength]
  );

  const filtered = useMemo(() => {
    if (!filter) return allStrings;
    const lower = filter.toLowerCase();
    return allStrings.filter((s: ExtractedString) => s.value.toLowerCase().includes(lower));
  }, [allStrings, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStrings = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="strings-view">
      <h3>🔤 Strings ({filtered.length.toLocaleString()} found)</h3>
      <InfoPanel title="Understanding String Extraction">
        <p>String extraction finds readable ASCII text embedded in the binary.
This can reveal file paths, error messages, version strings,
registry keys, URLs, and other useful information.</p>
        <pre>{`What strings can tell you:
• Error messages   → Hints about functionality
• File paths       → Files the program accesses
• Registry keys    → Configuration locations
• URLs             → Network endpoints
• DLL names        → Dependencies not in import table
• Debug symbols    → Function/variable names (if not stripped)

How it works:
Scan every byte → if 4+ consecutive printable ASCII chars
(0x20-0x7E) are found, it's reported as a string.

   Bytes:  48 65 6C 6C 6F 00 FF 01 57 6F 72 6C 64 00
   ASCII:   H  e  l  l  o  .  .  .  W  o  r  l  d  .
   Found:  "Hello"                  "World"`}</pre>
        <p>Filter and click any string to jump to its location in the hex viewer.</p>
      </InfoPanel>
      <div className="strings-controls">
        <label>
          Min length:
          <input
            type="number"
            min={2}
            max={32}
            value={minLength}
            onChange={(e) => {
              setMinLength(Number(e.target.value));
              setPage(0);
            }}
          />
        </label>
        <label>
          Filter:
          <input
            type="text"
            placeholder="Search strings..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Offset</th>
              <th>Length</th>
              <th>String</th>
            </tr>
          </thead>
          <tbody>
            {pageStrings.map((str: ExtractedString, i: number) => (
              <tr
                key={i}
                className="clickable-row"
                onClick={() => onStringClick?.(str.offset)}
              >
                <td className="mono">0x{toHex32(str.offset)}</td>
                <td className="mono">{str.value.length}</td>
                <td className="string-value">{str.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            ◄ Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next ►
          </button>
        </div>
      )}
    </div>
  );
}
