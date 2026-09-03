function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

function u32(value: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return buf;
}

export function zipUtf8Files(files: { name: string; content: string }[]) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.content, "utf8");
    const crc = crc32(data);
    const local = Buffer.concat([
      Buffer.from("PK\u0003\u0004", "binary"),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = Buffer.concat([
      Buffer.from("PK\u0001\u0002", "binary"),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }

  const centralDir = Buffer.concat(centrals);
  const end = Buffer.concat([
    Buffer.from("PK\u0005\u0006", "binary"),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);

  return Buffer.concat([...locals, centralDir, end]);
}
