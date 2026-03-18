import type { ELFFile, ELFHeader, ELFSection } from '../types/binary';

const ELF_MACHINE_TYPES: Record<number, string> = {
  0: 'None',
  2: 'SPARC',
  3: 'x86',
  8: 'MIPS',
  20: 'PowerPC',
  21: 'PowerPC64',
  40: 'ARM',
  43: 'SPARC V9',
  62: 'x86-64',
  183: 'AArch64',
  243: 'RISC-V',
};

const ELF_TYPES: Record<number, string> = {
  0: 'None',
  1: 'Relocatable',
  2: 'Executable',
  3: 'Shared Object',
  4: 'Core',
};

const ELF_SECTION_TYPES: Record<number, string> = {
  0: 'NULL',
  1: 'PROGBITS',
  2: 'SYMTAB',
  3: 'STRTAB',
  4: 'RELA',
  5: 'HASH',
  6: 'DYNAMIC',
  7: 'NOTE',
  8: 'NOBITS',
  9: 'REL',
  10: 'SHLIB',
  11: 'DYNSYM',
  14: 'INIT_ARRAY',
  15: 'FINI_ARRAY',
};

export function isELFFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 16) return false;
  const view = new DataView(buffer);
  return (
    view.getUint8(0) === 0x7f &&
    view.getUint8(1) === 0x45 && // 'E'
    view.getUint8(2) === 0x4c && // 'L'
    view.getUint8(3) === 0x46    // 'F'
  );
}

function getSectionFlags(flags: bigint): string[] {
  const result: string[] = [];
  if (flags & 0x1n) result.push('WRITE');
  if (flags & 0x2n) result.push('ALLOC');
  if (flags & 0x4n) result.push('EXECINSTR');
  if (flags & 0x10n) result.push('MERGE');
  if (flags & 0x20n) result.push('STRINGS');
  if (flags & 0x40n) result.push('INFO_LINK');
  if (flags & 0x80n) result.push('LINK_ORDER');
  if (flags & 0x100n) result.push('OS_NONCONFORMING');
  if (flags & 0x200n) result.push('GROUP');
  if (flags & 0x400n) result.push('TLS');
  return result;
}

export function parseELF(buffer: ArrayBuffer): ELFFile {
  const view = new DataView(buffer);

  const magic = [
    view.getUint8(0), view.getUint8(1),
    view.getUint8(2), view.getUint8(3),
  ];
  if (magic[0] !== 0x7f || magic[1] !== 0x45 || magic[2] !== 0x4c || magic[3] !== 0x46) {
    throw new Error('Invalid ELF magic');
  }

  const elfClass = view.getUint8(4);
  const is64 = elfClass === 2;
  const elfData = view.getUint8(5);
  const isLE = elfData === 1;

  const getU16 = (off: number) => view.getUint16(off, isLE);
  const getU32 = (off: number) => view.getUint32(off, isLE);
  const getU64 = (off: number) => view.getBigUint64(off, isLE);
  const addrSize = is64 ? 8 : 4;

  const type = getU16(16);
  const machine = getU16(18);

  let entryPoint: bigint, phoff: bigint, shoff: bigint;
  let flags: number, ehsize: number;
  let phentsize: number, phnum: number;
  let shentsize: number, shnum: number, shstrndx: number;

  if (is64) {
    entryPoint = getU64(24);
    phoff = getU64(32);
    shoff = getU64(40);
    flags = getU32(48);
    ehsize = getU16(52);
    phentsize = getU16(54);
    phnum = getU16(56);
    shentsize = getU16(58);
    shnum = getU16(60);
    shstrndx = getU16(62);
  } else {
    entryPoint = BigInt(getU32(24));
    phoff = BigInt(getU32(28));
    shoff = BigInt(getU32(32));
    flags = getU32(36);
    ehsize = getU16(40);
    phentsize = getU16(42);
    phnum = getU16(44);
    shentsize = getU16(46);
    shnum = getU16(48);
    shstrndx = getU16(50);
  }

  const header: ELFHeader = {
    class: elfClass,
    classStr: elfClass === 1 ? 'ELF32' : 'ELF64',
    data: elfData,
    dataStr: elfData === 1 ? 'Little Endian' : 'Big Endian',
    version: view.getUint8(6),
    osabi: view.getUint8(7),
    type,
    typeStr: ELF_TYPES[type] || `Unknown (${type})`,
    machine,
    machineStr: ELF_MACHINE_TYPES[machine] || `Unknown (${machine})`,
    entryPoint,
    phoff,
    shoff,
    flags,
    ehsize,
    phentsize,
    phnum,
    shentsize,
    shnum,
    shstrndx,
  };

  // Parse section headers
  const sections: ELFSection[] = [];
  const shoffNum = Number(shoff);

  // First, read the string table section to get section names
  let strtabOffset = 0;
  let strtabSize = 0;
  if (shstrndx < shnum && shstrndx !== 0) {
    const strSecOffset = shoffNum + shstrndx * shentsize;
    if (is64) {
      strtabOffset = Number(getU64(strSecOffset + 24));
      strtabSize = Number(getU64(strSecOffset + 32));
    } else {
      strtabOffset = getU32(strSecOffset + 16);
      strtabSize = getU32(strSecOffset + 20);
    }
  }

  const readSectionName = (nameIdx: number): string => {
    if (strtabOffset === 0 || nameIdx === 0) return '';
    const start = strtabOffset + nameIdx;
    if (start >= buffer.byteLength) return '';
    const chars: string[] = [];
    for (let i = 0; i < 256 && start + i < strtabOffset + strtabSize; i++) {
      const ch = view.getUint8(start + i);
      if (ch === 0) break;
      chars.push(String.fromCharCode(ch));
    }
    return chars.join('');
  };

  for (let i = 0; i < shnum; i++) {
    const secOffset = shoffNum + i * shentsize;
    if (secOffset + shentsize > buffer.byteLength) break;

    const nameIdx = getU32(secOffset);
    const secType = getU32(secOffset + 4);

    let secFlags: bigint, addr: bigint, offset: bigint, size: bigint;
    let link: number, info: number;
    let addralign: bigint, entsize: bigint;

    if (is64) {
      secFlags = getU64(secOffset + 8);
      addr = getU64(secOffset + 16);
      offset = getU64(secOffset + 24);
      size = getU64(secOffset + 32);
      link = getU32(secOffset + 40);
      info = getU32(secOffset + 44);
      addralign = getU64(secOffset + 48);
      entsize = getU64(secOffset + 56);
    } else {
      secFlags = BigInt(getU32(secOffset + 8));
      addr = BigInt(getU32(secOffset + 12));
      offset = BigInt(getU32(secOffset + 16));
      size = BigInt(getU32(secOffset + 20));
      link = getU32(secOffset + 24);
      info = getU32(secOffset + 28);
      addralign = BigInt(getU32(secOffset + 32));
      entsize = BigInt(getU32(secOffset + 36));
    }

    // addrSize used for determining field widths
    void addrSize;

    sections.push({
      name: readSectionName(nameIdx),
      type: secType,
      typeStr: ELF_SECTION_TYPES[secType] || `Unknown (${secType})`,
      flags: secFlags,
      flagsStr: getSectionFlags(secFlags),
      addr,
      offset,
      size,
      link,
      info,
      addralign,
      entsize,
    });
  }

  return {
    format: 'ELF',
    header,
    sections,
  };
}
