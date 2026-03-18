export interface DOSHeader {
  e_magic: number;
  e_lfanew: number;
}

export interface COFFHeader {
  machine: number;
  machineStr: string;
  numberOfSections: number;
  timeDateStamp: number;
  pointerToSymbolTable: number;
  numberOfSymbols: number;
  sizeOfOptionalHeader: number;
  characteristics: number;
}

export interface OptionalHeader {
  magic: number;
  magicStr: string;
  majorLinkerVersion: number;
  minorLinkerVersion: number;
  sizeOfCode: number;
  addressOfEntryPoint: number;
  imageBase: bigint;
  sectionAlignment: number;
  fileAlignment: number;
  majorOSVersion: number;
  minorOSVersion: number;
  sizeOfImage: number;
  sizeOfHeaders: number;
  subsystem: number;
  subsystemStr: string;
  numberOfRvaAndSizes: number;
  dataDirectories: DataDirectory[];
}

export interface DataDirectory {
  virtualAddress: number;
  size: number;
}

export interface SectionHeader {
  name: string;
  virtualSize: number;
  virtualAddress: number;
  sizeOfRawData: number;
  pointerToRawData: number;
  characteristics: number;
  characteristicsStr: string[];
}

export interface ImportEntry {
  dllName: string;
  functions: ImportFunction[];
}

export interface ImportFunction {
  name: string;
  hint: number;
  ordinal?: number;
}

export interface ExportEntry {
  name: string;
  ordinal: number;
  rva: number;
}

export interface ExportDirectory {
  name: string;
  base: number;
  numberOfFunctions: number;
  numberOfNames: number;
  entries: ExportEntry[];
}

export interface PEFile {
  format: 'PE';
  dosHeader: DOSHeader;
  coffHeader: COFFHeader;
  optionalHeader: OptionalHeader;
  sections: SectionHeader[];
  imports: ImportEntry[];
  exports: ExportDirectory | null;
}

export interface ELFHeader {
  class: number;
  classStr: string;
  data: number;
  dataStr: string;
  version: number;
  osabi: number;
  type: number;
  typeStr: string;
  machine: number;
  machineStr: string;
  entryPoint: bigint;
  phoff: bigint;
  shoff: bigint;
  flags: number;
  ehsize: number;
  phentsize: number;
  phnum: number;
  shentsize: number;
  shnum: number;
  shstrndx: number;
}

export interface ELFSection {
  name: string;
  type: number;
  typeStr: string;
  flags: bigint;
  flagsStr: string[];
  addr: bigint;
  offset: bigint;
  size: bigint;
  link: number;
  info: number;
  addralign: bigint;
  entsize: bigint;
}

export interface ELFFile {
  format: 'ELF';
  header: ELFHeader;
  sections: ELFSection[];
}

export type BinaryFile = PEFile | ELFFile;

export interface ExtractedString {
  offset: number;
  value: string;
}
