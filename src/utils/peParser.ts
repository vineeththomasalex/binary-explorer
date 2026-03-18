import type {
  PEFile,
  DOSHeader,
  COFFHeader,
  OptionalHeader,
  DataDirectory,
  SectionHeader,
  ImportEntry,
  ImportFunction,
  ExportDirectory,
  ExportEntry,
} from '../types/binary';
import { readNullTerminatedString } from './hexUtils';

const MACHINE_TYPES: Record<number, string> = {
  0x0: 'Unknown',
  0x14c: 'i386',
  0x8664: 'AMD64',
  0xaa64: 'ARM64',
  0x1c0: 'ARM',
  0x1c4: 'ARMv7',
  0x200: 'IA-64',
};

const SUBSYSTEM_TYPES: Record<number, string> = {
  0: 'Unknown',
  1: 'Native',
  2: 'Windows GUI',
  3: 'Windows Console',
  5: 'OS/2 Console',
  7: 'POSIX Console',
  9: 'Windows CE GUI',
  10: 'EFI Application',
  11: 'EFI Boot Service Driver',
  12: 'EFI Runtime Driver',
  13: 'EFI ROM',
  14: 'Xbox',
  16: 'Windows Boot Application',
};

const SECTION_FLAGS: Record<number, string> = {
  0x00000020: 'CODE',
  0x00000040: 'INITIALIZED_DATA',
  0x00000080: 'UNINITIALIZED_DATA',
  0x02000000: 'DISCARDABLE',
  0x04000000: 'NOT_CACHED',
  0x08000000: 'NOT_PAGED',
  0x10000000: 'SHARED',
  0x20000000: 'EXECUTE',
  0x40000000: 'READ',
  0x80000000: 'WRITE',
};

export function isPEFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 64) return false;
  const view = new DataView(buffer);
  return view.getUint16(0, true) === 0x5a4d; // "MZ"
}

function parseDOSHeader(view: DataView): DOSHeader {
  const e_lfanew = view.getUint32(0x3c, true);
  if (e_lfanew < 64 || e_lfanew > view.byteLength - 4) {
    throw new Error('Invalid PE offset (e_lfanew)');
  }
  return {
    e_magic: view.getUint16(0, true),
    e_lfanew,
  };
}

function parseCOFFHeader(view: DataView, offset: number): COFFHeader {
  const machine = view.getUint16(offset, true);
  return {
    machine,
    machineStr: MACHINE_TYPES[machine] || `Unknown (0x${machine.toString(16)})`,
    numberOfSections: view.getUint16(offset + 2, true),
    timeDateStamp: view.getUint32(offset + 4, true),
    pointerToSymbolTable: view.getUint32(offset + 8, true),
    numberOfSymbols: view.getUint32(offset + 12, true),
    sizeOfOptionalHeader: view.getUint16(offset + 16, true),
    characteristics: view.getUint16(offset + 18, true),
  };
}

function parseOptionalHeader(view: DataView, offset: number): OptionalHeader {
  const magic = view.getUint16(offset, true);
  const isPE32Plus = magic === 0x20b;

  let imageBase: bigint;
  let entryPointOffset = offset + 16;
  let imageBaseOffset = offset + 24;

  const addressOfEntryPoint = view.getUint32(entryPointOffset, true);

  if (isPE32Plus) {
    imageBase = view.getBigUint64(imageBaseOffset, true);
  } else {
    imageBase = BigInt(view.getUint32(imageBaseOffset, true));
  }

  const sectionAlignmentOffset = isPE32Plus ? offset + 32 : offset + 32;
  const fileAlignmentOffset = sectionAlignmentOffset + 4;

  const subsystemOffset = isPE32Plus ? offset + 68 : offset + 68;
  const numberOfRvaAndSizesOffset = isPE32Plus ? offset + 108 : offset + 92;

  const subsystem = view.getUint16(subsystemOffset, true);
  const numberOfRvaAndSizes = view.getUint32(numberOfRvaAndSizesOffset, true);

  const dataDirectoriesOffset = numberOfRvaAndSizesOffset + 4;
  const dataDirectories: DataDirectory[] = [];

  for (let i = 0; i < Math.min(numberOfRvaAndSizes, 16); i++) {
    const ddOffset = dataDirectoriesOffset + i * 8;
    if (ddOffset + 8 > view.byteLength) break;
    dataDirectories.push({
      virtualAddress: view.getUint32(ddOffset, true),
      size: view.getUint32(ddOffset + 4, true),
    });
  }

  return {
    magic,
    magicStr: isPE32Plus ? 'PE32+ (64-bit)' : 'PE32 (32-bit)',
    majorLinkerVersion: view.getUint8(offset + 2),
    minorLinkerVersion: view.getUint8(offset + 3),
    sizeOfCode: view.getUint32(offset + 4, true),
    addressOfEntryPoint,
    imageBase,
    sectionAlignment: view.getUint32(sectionAlignmentOffset, true),
    fileAlignment: view.getUint32(fileAlignmentOffset, true),
    majorOSVersion: view.getUint16(offset + 40, true),
    minorOSVersion: view.getUint16(offset + 42, true),
    sizeOfImage: view.getUint32(isPE32Plus ? offset + 56 : offset + 56, true),
    sizeOfHeaders: view.getUint32(isPE32Plus ? offset + 60 : offset + 60, true),
    subsystem,
    subsystemStr: SUBSYSTEM_TYPES[subsystem] || `Unknown (${subsystem})`,
    numberOfRvaAndSizes,
    dataDirectories,
  };
}

function getSectionCharacteristics(flags: number): string[] {
  const result: string[] = [];
  for (const [bit, name] of Object.entries(SECTION_FLAGS)) {
    if (flags & Number(bit)) {
      result.push(name);
    }
  }
  return result;
}

function parseSections(
  view: DataView,
  offset: number,
  count: number
): SectionHeader[] {
  const sections: SectionHeader[] = [];

  for (let i = 0; i < count; i++) {
    const sectionOffset = offset + i * 40;
    if (sectionOffset + 40 > view.byteLength) break;

    const nameBytes: number[] = [];
    for (let j = 0; j < 8; j++) {
      nameBytes.push(view.getUint8(sectionOffset + j));
    }
    const name = String.fromCharCode(...nameBytes.filter((b) => b !== 0));

    const characteristics = view.getUint32(sectionOffset + 36, true);

    sections.push({
      name,
      virtualSize: view.getUint32(sectionOffset + 8, true),
      virtualAddress: view.getUint32(sectionOffset + 12, true),
      sizeOfRawData: view.getUint32(sectionOffset + 16, true),
      pointerToRawData: view.getUint32(sectionOffset + 20, true),
      characteristics,
      characteristicsStr: getSectionCharacteristics(characteristics),
    });
  }

  return sections;
}

function rvaToFileOffset(rva: number, sections: SectionHeader[], bufferLength: number): number | null {
  for (const section of sections) {
    if (
      rva >= section.virtualAddress &&
      rva < section.virtualAddress + Math.max(section.virtualSize, section.sizeOfRawData)
    ) {
      const fileOffset = rva - section.virtualAddress + section.pointerToRawData;
      if (fileOffset < 0 || fileOffset >= bufferLength) {
        return null;
      }
      return fileOffset;
    }
  }
  return null;
}

function parseImports(
  view: DataView,
  optionalHeader: OptionalHeader,
  sections: SectionHeader[]
): ImportEntry[] {
  if (optionalHeader.dataDirectories.length < 2) return [];

  const importDir = optionalHeader.dataDirectories[1];
  if (importDir.virtualAddress === 0 || importDir.size === 0) return [];

  const importOffset = rvaToFileOffset(importDir.virtualAddress, sections, view.byteLength);
  if (importOffset === null) return [];

  const imports: ImportEntry[] = [];
  const isPE32Plus = optionalHeader.magic === 0x20b;
  let entryOffset = importOffset;

  for (let i = 0; i < 256; i++) {
    if (entryOffset + 20 > view.byteLength) break;

    const originalFirstThunk = view.getUint32(entryOffset, true);
    const nameRVA = view.getUint32(entryOffset + 12, true);
    const firstThunk = view.getUint32(entryOffset + 16, true);

    if (nameRVA === 0 && originalFirstThunk === 0 && firstThunk === 0) break;

    const nameOffset = rvaToFileOffset(nameRVA, sections, view.byteLength);
    if (nameOffset === null) {
      entryOffset += 20;
      continue;
    }

    const dllName = readNullTerminatedString(view, nameOffset);
    const functions: ImportFunction[] = [];

    const lookupRVA = originalFirstThunk || firstThunk;
    if (lookupRVA) {
      const lookupOffset = rvaToFileOffset(lookupRVA, sections, view.byteLength);
      if (lookupOffset !== null) {
        let funcOffset = lookupOffset;
        const entrySize = isPE32Plus ? 8 : 4;

        for (let j = 0; j < 4096; j++) {
          if (funcOffset + entrySize > view.byteLength) break;

          let value: bigint;
          if (isPE32Plus) {
            value = view.getBigUint64(funcOffset, true);
          } else {
            value = BigInt(view.getUint32(funcOffset, true));
          }

          if (value === 0n) break;

          const ordinalFlag = isPE32Plus ? 1n << 63n : 1n << 31n;
          if (value & ordinalFlag) {
            functions.push({
              name: `Ordinal ${Number(value & 0xffffn)}`,
              hint: 0,
              ordinal: Number(value & 0xffffn),
            });
          } else {
            const hintNameRVA = Number(value & 0x7fffffffn);
            const hintNameOffset = rvaToFileOffset(hintNameRVA, sections, view.byteLength);
            if (hintNameOffset !== null && hintNameOffset + 2 < view.byteLength) {
              const hint = view.getUint16(hintNameOffset, true);
              const funcName = readNullTerminatedString(view, hintNameOffset + 2);
              functions.push({ name: funcName || `Unknown`, hint });
            }
          }

          funcOffset += entrySize;
        }
      }
    }

    imports.push({ dllName, functions });
    entryOffset += 20;
  }

  return imports;
}

function parseExports(
  view: DataView,
  optionalHeader: OptionalHeader,
  sections: SectionHeader[]
): ExportDirectory | null {
  if (optionalHeader.dataDirectories.length < 1) return null;

  const exportDir = optionalHeader.dataDirectories[0];
  if (exportDir.virtualAddress === 0 || exportDir.size === 0) return null;

  const exportOffset = rvaToFileOffset(exportDir.virtualAddress, sections, view.byteLength);
  if (exportOffset === null) return null;

  if (exportOffset + 40 > view.byteLength) return null;

  const nameRVA = view.getUint32(exportOffset + 12, true);
  const base = view.getUint32(exportOffset + 16, true);
  const numberOfFunctions = view.getUint32(exportOffset + 20, true);
  const numberOfNames = view.getUint32(exportOffset + 24, true);
  const addressOfFunctionsRVA = view.getUint32(exportOffset + 28, true);
  const addressOfNamesRVA = view.getUint32(exportOffset + 32, true);
  const addressOfNameOrdinalsRVA = view.getUint32(exportOffset + 36, true);

  const nameOffset = rvaToFileOffset(nameRVA, sections, view.byteLength);
  const dllName = nameOffset !== null ? readNullTerminatedString(view, nameOffset) : 'Unknown';

  const entries: ExportEntry[] = [];

  const functionsOffset = rvaToFileOffset(addressOfFunctionsRVA, sections, view.byteLength);
  const namesOffset = rvaToFileOffset(addressOfNamesRVA, sections, view.byteLength);
  const ordinalsOffset = rvaToFileOffset(addressOfNameOrdinalsRVA, sections, view.byteLength);

  if (functionsOffset !== null && namesOffset !== null && ordinalsOffset !== null) {
    for (let i = 0; i < Math.min(numberOfNames, 4096); i++) {
      if (namesOffset + i * 4 + 4 > view.byteLength) break;
      if (ordinalsOffset + i * 2 + 2 > view.byteLength) break;

      const funcNameRVA = view.getUint32(namesOffset + i * 4, true);
      const ordinalIndex = view.getUint16(ordinalsOffset + i * 2, true);

      const funcNameOffset = rvaToFileOffset(funcNameRVA, sections, view.byteLength);
      const funcName = funcNameOffset !== null
        ? readNullTerminatedString(view, funcNameOffset)
        : `Ordinal ${ordinalIndex + base}`;

      let rva = 0;
      if (functionsOffset + ordinalIndex * 4 + 4 <= view.byteLength) {
        rva = view.getUint32(functionsOffset + ordinalIndex * 4, true);
      }

      entries.push({
        name: funcName,
        ordinal: ordinalIndex + base,
        rva,
      });
    }
  } else if (functionsOffset !== null) {
    for (let i = 0; i < Math.min(numberOfFunctions, 4096); i++) {
      if (functionsOffset + i * 4 + 4 > view.byteLength) break;
      const rva = view.getUint32(functionsOffset + i * 4, true);
      if (rva !== 0) {
        entries.push({ name: `Ordinal ${i + base}`, ordinal: i + base, rva });
      }
    }
  }

  return {
    name: dllName,
    base,
    numberOfFunctions,
    numberOfNames,
    entries,
  };
}

export function parsePE(buffer: ArrayBuffer): PEFile {
  const view = new DataView(buffer);

  const dosHeader = parseDOSHeader(view);
  if (dosHeader.e_magic !== 0x5a4d) {
    throw new Error('Invalid DOS header: missing MZ signature');
  }

  const peOffset = dosHeader.e_lfanew;
  if (peOffset + 4 > buffer.byteLength) {
    throw new Error('Invalid PE offset');
  }

  const peSignature = view.getUint32(peOffset, true);
  if (peSignature !== 0x00004550) {
    throw new Error('Invalid PE signature');
  }

  const coffOffset = peOffset + 4;
  const coffHeader = parseCOFFHeader(view, coffOffset);

  const optionalOffset = coffOffset + 20;
  const optionalHeader = parseOptionalHeader(view, optionalOffset);

  const sectionsOffset = optionalOffset + coffHeader.sizeOfOptionalHeader;
  const sections = parseSections(view, sectionsOffset, coffHeader.numberOfSections);

  const imports = parseImports(view, optionalHeader, sections);
  const exports = parseExports(view, optionalHeader, sections);

  return {
    format: 'PE',
    dosHeader,
    coffHeader,
    optionalHeader,
    sections,
    imports,
    exports,
  };
}
