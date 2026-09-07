import Papa from "papaparse";
import { splitFullName } from "@/lib/alumni";

export type ImportedAlumnus = {
  firstName: string;
  lastName: string | null;
  cohortYear: number | null;
  currentOrganization: string | null;
  currentRole: string | null;
  boardMemberships: string | null;
  linkedin: string | null;
  personalEmail: string | null;
  workEmail: string | null;
};

export type ParsedRow = {
  rowNumber: number;
  data: ImportedAlumnus;
  warnings: string[];
  error: string | null;
};

export type ParseResult = {
  rows: ParsedRow[];
  unmappedHeaders: string[];
  missingNameColumn: boolean;
};

// Header text varies between exports, so match on a squashed form: "Cohort Year",
// "cohort_year" and "cohortyear" all collapse to the same key.
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const HEADER_ALIASES: Record<string, keyof ImportedAlumnus | "fullName"> = {
  name: "fullName",
  fullname: "fullName",
  alumniname: "fullName",
  firstname: "firstName",
  givenname: "firstName",
  lastname: "lastName",
  surname: "lastName",
  familyname: "lastName",
  cohort: "cohortYear",
  cohortyear: "cohortYear",
  organization: "currentOrganization",
  organisation: "currentOrganization",
  currentorganization: "currentOrganization",
  company: "currentOrganization",
  employer: "currentOrganization",
  role: "currentRole",
  title: "currentRole",
  jobtitle: "currentRole",
  currentrole: "currentRole",
  position: "currentRole",
  boardmemberships: "boardMemberships",
  boardmembership: "boardMemberships",
  boards: "boardMemberships",
  linkedin: "linkedin",
  linkedinurl: "linkedin",
  linkedinprofile: "linkedin",
  personalemail: "personalEmail",
  personalemailaddress: "personalEmail",
  workemail: "workEmail",
  workemailaddress: "workEmail",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function blankToNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeEmail(
  value: string | null,
  label: string,
  warnings: string[],
): string | null {
  if (!value) return null;
  const email = value.toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    warnings.push(`${label} "${value}" does not look like an email address.`);
  }
  return email;
}

// Adds a scheme so the value is clickable, but never rewrites the host — the
// Notion export contained "linkdin.com" typos, and silently "correcting" those
// would invent a profile URL that may not exist.
function normalizeLinkedin(
  value: string | null,
  warnings: string[],
): string | null {
  if (!value) return null;

  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  let host: string;
  try {
    host = new URL(withScheme).hostname.toLowerCase();
  } catch {
    warnings.push(`LinkedIn "${value}" is not a usable URL.`);
    return value;
  }

  if (!/(^|\.)linkedin\.com$/.test(host)) {
    warnings.push(`LinkedIn "${value}" is not a linkedin.com address.`);
  }

  return withScheme;
}

function parseCohortYear(
  value: string | null,
  warnings: string[],
): number | null {
  if (!value) return null;

  const match = value.match(/\d{4}/);
  if (!match) {
    warnings.push(`Cohort year "${value}" is not a four-digit year.`);
    return null;
  }

  const year = Number(match[0]);
  if (year < 1900 || year > 2100) {
    warnings.push(`Cohort year "${value}" is outside the expected range.`);
    return null;
  }

  return year;
}

export function parseAlumniCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const mapping = new Map<string, keyof ImportedAlumnus | "fullName">();
  const unmappedHeaders: string[] = [];

  for (const header of headers) {
    const target = HEADER_ALIASES[normalizeHeader(header)];
    if (target) {
      mapping.set(header, target);
    } else if (header.trim() !== "") {
      unmappedHeaders.push(header);
    }
  }

  const targets = new Set(mapping.values());
  const missingNameColumn =
    !targets.has("fullName") && !targets.has("firstName");

  const rows: ParsedRow[] = parsed.data.map((record, index) => {
    const warnings: string[] = [];
    const values: Partial<Record<keyof ImportedAlumnus | "fullName", string>> =
      {};

    for (const [header, target] of mapping) {
      const cell = blankToNull(record[header]);
      if (cell !== null) values[target] = cell;
    }

    let firstName = values.firstName?.trim() ?? "";
    let lastName = values.lastName?.trim() || null;

    // A dedicated first/last pair wins; otherwise fall back to splitting "Name".
    if (!firstName && values.fullName) {
      const split = splitFullName(values.fullName);
      firstName = split.firstName;
      lastName = lastName ?? split.lastName;
      warnings.push(...split.warnings);
    }

    const data: ImportedAlumnus = {
      firstName,
      lastName,
      cohortYear: parseCohortYear(values.cohortYear ?? null, warnings),
      currentOrganization: values.currentOrganization ?? null,
      currentRole: values.currentRole ?? null,
      boardMemberships: values.boardMemberships ?? null,
      linkedin: normalizeLinkedin(values.linkedin ?? null, warnings),
      personalEmail: normalizeEmail(
        values.personalEmail ?? null,
        "Personal email",
        warnings,
      ),
      workEmail: normalizeEmail(values.workEmail ?? null, "Work email", warnings),
    };

    return {
      rowNumber: index + 2, // +1 for the header row, +1 for 1-based counting
      data,
      warnings,
      error: firstName ? null : "No name in this row — skipped.",
    };
  });

  return { rows, unmappedHeaders, missingNameColumn };
}

export type MatchKeys = {
  linkedinKey: string | null;
  nameKey: string;
};

// Two keys rather than one, tried in order. A LinkedIn URL is the closest thing
// to a stable identifier, but it is not reliable on its own: the same person can
// be stored with a typo'd or missing profile ("JANEDOE.linkdin.com") and a clean
// URL in the spreadsheet, which would read as two different people. Falling back
// to name + cohort catches that. It can in principle merge two same-named alumni
// from one cohort, which is why the preview labels every match as an update
// before anything is written.
export function matchKeys(row: {
  firstName: string;
  lastName: string | null;
  cohortYear: number | null;
  linkedin: string | null;
}): MatchKeys {
  return {
    linkedinKey: row.linkedin
      ? `linkedin:${row.linkedin.toLowerCase().replace(/\/+$/, "")}`
      : null,
    nameKey: `name:${row.firstName.toLowerCase()}|${(row.lastName ?? "").toLowerCase()}|${row.cohortYear ?? ""}`,
  };
}
