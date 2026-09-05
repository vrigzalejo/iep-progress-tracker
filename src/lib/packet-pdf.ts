function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, width = 88) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function buildPacketLines(input: {
  title: string;
  studentName: string;
  subtitle: string;
  sections: { heading: string; body: string[] }[];
}) {
  const lines = [input.title, input.studentName, input.subtitle, ""];
  for (const section of input.sections) {
    lines.push(section.heading);
    for (const paragraph of section.body) {
      lines.push(...wrapLine(paragraph));
    }
    lines.push("");
  }
  lines.push("This packet is session data the team already recorded. It does not recommend services or placement.");
  return lines;
}

export function packetFromStudent(input: {
  kind: "PACKET" | "REPORT";
  studentName: string;
  grade: string;
  school: string;
  periodLabel?: string | null;
  goals: {
    plainLanguageSummary: string;
    officialWording: string;
    unit: string;
    entries: { sessionOutcome: string; score: number; recordedAt: Date | string; notes: string }[];
    periodStatements: { narrative: string; progressCode: string }[];
  }[];
}) {
  return buildPacketLines({
    title: input.kind === "PACKET" ? "IEP meeting packet" : "Progress report",
    studentName: input.studentName,
    subtitle: `Grade ${input.grade} · ${input.school}${input.periodLabel ? ` · ${input.periodLabel}` : ""}`,
    sections: input.goals.map((goal) => {
      const present = goal.entries.filter((entry) => entry.sessionOutcome === "PRESENT").slice(-5);
      const statement = goal.periodStatements[0];
      return {
        heading: goal.plainLanguageSummary,
        body: [
          goal.officialWording,
          statement ? `Staff progress code: ${statement.progressCode}. ${statement.narrative}` : "No period comment on file.",
          present.length
            ? `Last present sessions: ${present.map((entry) => `${entry.score} ${goal.unit}`).join("; ")}`
            : "No present sessions on file.",
        ],
      };
    }),
  });
}

export function encodeSimplePdf(lines: string[]) {
  const page = lines.slice(0, 48);
  const content = page
    .map((line, index) => `1 0 0 1 48 ${740 - index * 14} Tm (${escapePdf(line.slice(0, 110))}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 11 Tf\n${content}\nET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let offset = 9;
  const xref = ["0000000000 65535 f "];
  let body = "";
  for (const object of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    body += `${object}\n`;
    offset += Buffer.byteLength(`${object}\n`);
  }
  const pdf = `%PDF-1.4\n${body}xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}
