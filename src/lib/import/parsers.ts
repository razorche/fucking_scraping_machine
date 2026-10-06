import JSZip from "jszip";
import { sanitizeCsvCell } from "@/lib/leads/sanitize-csv-cell";
import { normalizeEmail } from "@/lib/leads/normalize-email";
import { isValidEmail } from "@/lib/leads/validate-email";
import { isSafeArchiveEntry } from "@/lib/import/safe-entry-path";
import type { ParseResult, ParsedLeadInput } from "@/lib/import/types";

export function parseDelimitedText(content: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuote = false;
  const cleaned = content.replace(/^\uFEFF/, "");

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];
    if (insideQuote) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        insideQuote = false;
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      insideQuote = true;
    } else if (char === delimiter) {
      currentRow.push(sanitizeCsvCell(currentField.trim()));
      currentField = "";
    } else if (char === "\r" && nextChar === "\n") {
      currentRow.push(sanitizeCsvCell(currentField.trim()));
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
    } else if (char === "\n" || char === "\r") {
      currentRow.push(sanitizeCsvCell(currentField.trim()));
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(sanitizeCsvCell(currentField.trim()));
    rows.push(currentRow);
  }
  return rows.filter((r) => r.length > 0 && r.some((f) => f.length > 0));
}

export function parseCsvOrTsv(content: string, filename = "import.csv"): ParseResult {
  const isTsv = filename.endsWith(".tsv") || (!filename.endsWith(".csv") && content.includes("\t"));
  const delimiter = isTsv ? "\t" : ",";
  const rows = parseDelimitedText(content, delimiter);
  const rowErrors: string[] = [];

  if (rows.length === 0) {
    return {
      leads: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      filesProcessed: [filename],
      errors: ["Datoteka je prazna."],
      rowErrors: [],
    };
  }

  const rawHeader = rows[0]!.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const dataRows = rows.slice(1);
  const emailIdx = rawHeader.findIndex((h) => h.includes("email") || h === "to" || h === "mail");
  const companyIdx = rawHeader.findIndex(
    (h) => h.includes("company") || h.includes("legalname") || h.includes("carrier") || h === "dba",
  );
  const ownerIdx = rawHeader.findIndex(
    (h) => h.includes("owner") || h.includes("contact") || h.includes("name") || h.includes("first"),
  );
  const dotIdx = rawHeader.findIndex((h) => h.includes("dot") || h.includes("usdot"));
  const powerUnitsIdx = rawHeader.findIndex(
    (h) => h.includes("powerunit") || h.includes("fleet") || h.includes("trucks") || h.includes("units"),
  );
  const cityIdx = rawHeader.findIndex((h) => h.includes("city") || h.includes("grad"));
  const stateIdx = rawHeader.findIndex((h) => h.includes("state") || h.includes("drzava"));
  const phoneIdx = rawHeader.findIndex((h) => h.includes("phone") || h.includes("tel"));
  const websiteIdx = rawHeader.findIndex((h) => h.includes("website") || h.includes("web") || h.includes("url"));

  const leads: ParsedLeadInput[] = [];
  let validRows = 0;
  let invalidRows = 0;

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex]!;
    const emailRaw = emailIdx >= 0 ? row[emailIdx] : row.find((c) => c.includes("@"));
    if (!emailRaw || !isValidEmail(emailRaw)) {
      invalidRows++;
      rowErrors.push(`Red ${rowIndex + 2}: nevažeći email`);
      continue;
    }
    const owner = ownerIdx >= 0 ? row[ownerIdx] : "";
    leads.push({
      email: normalizeEmail(emailRaw),
      company: companyIdx >= 0 && row[companyIdx] ? row[companyIdx] : "Američki prevoznik",
      ownerName: owner || undefined,
      firstName: owner ? owner.split(" ")[0] : undefined,
      lastName: owner && owner.split(" ").length > 1 ? owner.split(" ").slice(1).join(" ") : undefined,
      dotNumber: dotIdx >= 0 ? row[dotIdx] : undefined,
      powerUnits: powerUnitsIdx >= 0 ? parseInt(row[powerUnitsIdx] ?? "", 10) || undefined : undefined,
      city: cityIdx >= 0 ? row[cityIdx] : undefined,
      state: stateIdx >= 0 ? row[stateIdx] : undefined,
      phone: phoneIdx >= 0 ? row[phoneIdx] : undefined,
      website: websiteIdx >= 0 ? row[websiteIdx] : undefined,
      source: "CSV/TSV uvoz",
      sourceFile: filename,
      sourceRow: rowIndex + 2,
    });
    validRows++;
  }

  return {
    leads,
    totalRows: dataRows.length,
    validRows,
    invalidRows,
    filesProcessed: [filename],
    errors: [],
    rowErrors,
  };
}

export function parseFmcsaTxtBlocks(content: string, filename = "fmcsa.txt"): ParseResult {
  const blocks = content.split(/\n\s*[-=_]{3,}\s*\n|\n\s*\n\s*\n/);
  const leads: ParsedLeadInput[] = [];
  const rowErrors: string[] = [];
  let validRows = 0;
  let invalidRows = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!.trim();
    if (!block) continue;
    const lines = block.split("\n").map((l) => l.trim());
    let email = "";
    let companyName = "";
    let owner = "";
    let dot = "";
    let powerUnits: number | undefined;
    let city = "";
    let state = "";
    let phone = "";
    let website = "";

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith("to:") || lower.startsWith("email:")) {
        email = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("company:") || lower.startsWith("carrier:") || lower.startsWith("legal:")) {
        companyName = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("owner:") || lower.startsWith("contact:")) {
        owner = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("dot:") || lower.startsWith("usdot:")) {
        dot = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("power units:") || lower.startsWith("fleet:") || lower.startsWith("trucks:")) {
        const num = parseInt(line.split(/:\s*/)[1] ?? "", 10);
        if (!Number.isNaN(num)) powerUnits = num;
      } else if (lower.startsWith("city:") || lower.startsWith("grad:")) {
        city = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("state:") || lower.startsWith("drzava:")) {
        state = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("phone:") || lower.startsWith("tel:")) {
        phone = line.split(/:\s*/)[1] ?? "";
      } else if (lower.startsWith("website:") || lower.startsWith("web:")) {
        website = line.split(/:\s*/)[1] ?? "";
      } else if (!email && line.includes("@")) {
        const matched = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (matched) email = matched[0];
      }
    }

    if (!isValidEmail(email)) {
      invalidRows++;
      rowErrors.push(`Blok ${i + 1}: nevažeći email`);
      continue;
    }

    leads.push({
      company: companyName || "Američki kamionski prevoznik",
      email: normalizeEmail(email),
      ownerName: owner || undefined,
      firstName: owner ? owner.split(" ")[0] : undefined,
      dotNumber: dot || undefined,
      powerUnits: powerUnits ?? (dot ? 12 : undefined),
      city: city || undefined,
      state: state || undefined,
      phone: phone || undefined,
      website: website || undefined,
      source: "FMCSA TXT",
      sourceFile: filename,
      sourceRow: i + 1,
    });
    validRows++;
  }

  return {
    leads,
    totalRows: validRows + invalidRows,
    validRows,
    invalidRows,
    filesProcessed: [filename],
    errors: [],
    rowErrors,
  };
}

export async function parseUploadBuffer(
  buffer: ArrayBuffer,
  filename: string,
): Promise<ParseResult> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".zip")) {
    return parseZipArchive(buffer);
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
    return parseCsvOrTsv(text, filename);
  }
  if (text.includes("TO:") || text.includes("Company:") || text.includes("DOT:")) {
    return parseFmcsaTxtBlocks(text, filename);
  }
  return parseCsvOrTsv(text, filename);
}

export async function parseZipArchive(fileData: ArrayBuffer): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(fileData);
  const combinedLeads: ParsedLeadInput[] = [];
  const filesProcessed: string[] = [];
  const errors: string[] = [];
  const rowErrors: string[] = [];
  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;

  for (const relativePath of Object.keys(zip.files)) {
    const zipEntry = zip.files[relativePath];
    if (!zipEntry || zipEntry.dir) continue;
    if (!isSafeArchiveEntry(relativePath)) {
      errors.push(`Preskočena nesigurna putanja: ${relativePath}`);
      continue;
    }
    const lowerPath = relativePath.toLowerCase();
    if (!lowerPath.endsWith(".txt") && !lowerPath.endsWith(".csv") && !lowerPath.endsWith(".tsv")) {
      continue;
    }
    try {
      const textContent = await zipEntry.async("text");
      filesProcessed.push(relativePath);
      let result: ParseResult;
      if (lowerPath.endsWith(".csv") || lowerPath.endsWith(".tsv")) {
        result = parseCsvOrTsv(textContent, relativePath);
      } else if (
        textContent.includes("TO:") ||
        textContent.includes("Company:") ||
        textContent.includes("DOT:")
      ) {
        result = parseFmcsaTxtBlocks(textContent, relativePath);
      } else {
        result = parseCsvOrTsv(textContent, relativePath);
      }
      combinedLeads.push(...result.leads);
      totalRows += result.totalRows;
      validRows += result.validRows;
      invalidRows += result.invalidRows;
      rowErrors.push(...result.rowErrors);
    } catch (e) {
      errors.push(`Greška pri čitanju ${relativePath}: ${e instanceof Error ? e.message : "nepoznato"}`);
    }
  }

  return {
    leads: combinedLeads,
    totalRows,
    validRows,
    invalidRows,
    filesProcessed,
    errors,
    rowErrors,
  };
}
