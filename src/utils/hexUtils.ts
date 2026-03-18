export function toHex(value: number, pad: number = 2): string {
  return value.toString(16).toUpperCase().padStart(pad, '0');
}

export function toHex32(value: number): string {
  return toHex(value, 8);
}

export function toHexBigInt(value: bigint, pad: number = 16): string {
  return value.toString(16).toUpperCase().padStart(pad, '0');
}

export function formatOffset(offset: number): string {
  return toHex(offset, 8);
}

export function isPrintableAscii(byte: number): boolean {
  return byte >= 0x20 && byte <= 0x7e;
}

export function byteToAscii(byte: number): string {
  return isPrintableAscii(byte) ? String.fromCharCode(byte) : '.';
}

export function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toUTCString();
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function readNullTerminatedString(
  view: DataView,
  offset: number,
  maxLen: number = 256
): string {
  const chars: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (offset + i >= view.byteLength) break;
    const byte = view.getUint8(offset + i);
    if (byte === 0) break;
    chars.push(String.fromCharCode(byte));
  }
  return chars.join('');
}
