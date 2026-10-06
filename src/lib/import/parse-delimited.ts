import { sanitizeCsvCell } from "@/lib/leads/sanitize-csv-cell";

export type DelimitedParseOptions = {
  delimiter: "," | "\t" | "|";
  hasHeader?: boolean;
};

export function parseDelimitedText(
  raw: string,
  options: DelimitedParseOptions,
): { headers: string[]; rows: string[][] } {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const splitLine = (line: string) =>
    line.split(options.delimiter).map((cell) => sanitizeCsvCell(cell));

  const hasHeader = options.hasHeader ?? true;
  const headers = hasHeader ? splitLine(lines[0]!) : [];
  const body = hasHeader ? lines.slice(1) : lines;

  const rows = body.map(splitLine);
  return { headers, rows };
}
