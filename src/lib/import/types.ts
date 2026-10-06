export type ParsedLeadInput = {
  email: string;
  company?: string;
  ownerName?: string;
  firstName?: string;
  lastName?: string;
  dotNumber?: string;
  powerUnits?: number;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  source?: string;
  sourceFile?: string;
  sourceRow?: number;
};

export type ParseResult = {
  leads: ParsedLeadInput[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  filesProcessed: string[];
  errors: string[];
  rowErrors: string[];
};
