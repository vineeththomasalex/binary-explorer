import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const buf = Buffer.alloc(1024, 0);

// DOS Header
buf.write('MZ', 0);
buf.writeUInt32LE(0x80, 0x3C); // e_lfanew → PE header at 0x80

// PE Signature
buf.write('PE\0\0', 0x80);

// COFF Header at 0x84
buf.writeUInt16LE(0x8664, 0x84);              // Machine: AMD64
buf.writeUInt16LE(1, 0x86);                   // NumberOfSections
buf.writeUInt32LE(Math.floor(Date.now() / 1000), 0x88); // TimeDateStamp
buf.writeUInt32LE(0, 0x8C);                   // PointerToSymbolTable
buf.writeUInt32LE(0, 0x90);                   // NumberOfSymbols
buf.writeUInt16LE(0xF0, 0x94);                // SizeOfOptionalHeader
buf.writeUInt16LE(0x22, 0x96);                // Characteristics

// Optional Header at 0x98
buf.writeUInt16LE(0x20B, 0x98);               // Magic: PE32+
buf.writeUInt8(14, 0x9A);                     // MajorLinkerVersion
buf.writeUInt8(0, 0x9B);                      // MinorLinkerVersion
buf.writeUInt32LE(0x1000, 0xA0);              // AddressOfEntryPoint

// Section Header at 0x188 (0x98 + 0xF0)
const sectOff = 0x98 + 0xF0;
buf.write('.text\0\0\0', sectOff);
buf.writeUInt32LE(0x100, sectOff + 8);        // VirtualSize
buf.writeUInt32LE(0x1000, sectOff + 12);      // VirtualAddress
buf.writeUInt32LE(0x100, sectOff + 16);       // SizeOfRawData
buf.writeUInt32LE(0x200, sectOff + 20);       // PointerToRawData
buf.writeUInt32LE(0x60000020, sectOff + 36);  // Characteristics: CODE|EXECUTE|READ

// Write ASCII strings in the data area for string extraction tests
buf.write('Hello World Test Binary', 0x200);
buf.write('TestString123', 0x220);

writeFileSync(join(__dirname, 'test.exe'), buf);
console.log('Generated test.exe (' + buf.length + ' bytes)');
