import type { ExtractedString } from '../types/binary';

export function extractStrings(
  buffer: ArrayBuffer,
  minLength: number = 4
): ExtractedString[] {
  const bytes = new Uint8Array(buffer);
  const strings: ExtractedString[] = [];
  let current = '';
  let startOffset = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 0x20 && byte <= 0x7e) {
      if (current.length === 0) {
        startOffset = i;
      }
      current += String.fromCharCode(byte);
    } else {
      const maxStringLength = 1000;
      if (current.length >= minLength) {
        strings.push({
          offset: startOffset,
          value: current.length > maxStringLength
            ? current.slice(0, maxStringLength)
            : current,
        });
      }
      current = '';
    }
  }

  if (current.length >= minLength) {
    strings.push({
      offset: startOffset,
      value: current.length > 1000 ? current.slice(0, 1000) : current,
    });
  }

  return strings;
}
