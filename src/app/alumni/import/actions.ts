"use server";

import { revalidatePath } from "next/cache";
import {
  matchKeys,
  parseAlumniCsv,
  type ParsedRow,
} from "@/lib/alumni-import";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canImportAlumni, type Role } from "@/lib/workflow";

export type PreviewRow = {
  rowNumber: number;
  name: string;
  organization: string | null;
  cohortYear: number | null;
  action: "create" | "update" | "skip" | "duplicate";
  warnings: string[];
  error: string | null;
};

export type ImportState =
  | { stage: "idle"; message?: string }
  | { stage: "error"; message: string }
  | {
      stage: "preview";
      csvText: string;
      rows: PreviewRow[];
      totals: {
        create: number;
        update: number;
        skip: number;
        duplicate: number;
      };
      unmappedHeaders: string[];
    }
  | { stage: "done"; created: number; updated: number; skipped: number };

const MAX_PREVIEW_ROWS = 50;

async function classify(parsedRows: ParsedRow[]) {
  const existing = await prisma.alumnus.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cohortYear: true,
      linkedin: true,
    },
  });

  const byLinkedin = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const person of existing) {
    const keys = matchKeys(person);
    if (keys.linkedinKey) byLinkedin.set(keys.linkedinKey, person.id);
    byName.set(keys.nameKey, person.id);
  }

  const seenInFile = new Set<string>();

  return parsedRows.map((row) => {
    const keys = matchKeys(row.data);
    const existingId =
      (keys.linkedinKey ? byLinkedin.get(keys.linkedinKey) : undefined) ??
      byName.get(keys.nameKey) ??
      null;

    // Dedupe within the file on both keys, so the same person listed twice under
    // different LinkedIn spellings is still caught.
    const fileKeys = [keys.linkedinKey, keys.nameKey].filter(
      Boolean,
    ) as string[];

    let action: PreviewRow["action"];

    if (row.error) {
      action = "skip";
    } else if (fileKeys.some((key) => seenInFile.has(key))) {
      action = "duplicate";
    } else {
      action = existingId ? "update" : "create";
      for (const key of fileKeys) seenInFile.add(key);
    }

    return { row, action, existingId };
  });
}

export async function importAlumni(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await getCurrentUser();
  if (!canImportAlumni(user.role as Role)) {
    return {
      stage: "error",
      message: "Your role cannot import alumni records.",
    };
  }

  const intent = String(formData.get("intent") ?? "");

  if (intent === "preview") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { stage: "error", message: "Choose a CSV file first." };
    }

    const csvText = await file.text();
    const parsed = parseAlumniCsv(csvText);

    if (parsed.missingNameColumn) {
      return {
        stage: "error",
        message:
          'No name column found. The file needs a "Name" column, or "First name" and "Last name".',
      };
    }

    const classified = await classify(parsed.rows);
    const totals = { create: 0, update: 0, skip: 0, duplicate: 0 };
    for (const item of classified) totals[item.action] += 1;

    return {
      stage: "preview",
      csvText,
      unmappedHeaders: parsed.unmappedHeaders,
      totals,
      rows: classified.slice(0, MAX_PREVIEW_ROWS).map(({ row, action }) => ({
        rowNumber: row.rowNumber,
        name: [row.data.firstName, row.data.lastName].filter(Boolean).join(" "),
        organization: row.data.currentOrganization,
        cohortYear: row.data.cohortYear,
        action,
        warnings: row.warnings,
        error: row.error,
      })),
    };
  }

  if (intent === "commit") {
    const csvText = String(formData.get("csvText") ?? "");
    if (!csvText) {
      return { stage: "error", message: "Nothing to import." };
    }

    const parsed = parseAlumniCsv(csvText);
    const classified = await classify(parsed.rows);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const { row, action, existingId } of classified) {
      if (action === "skip" || action === "duplicate") {
        skipped += 1;
        continue;
      }

      // Only write cells the file actually filled in. A blank column must not
      // erase something a staff member typed into the dashboard, and the
      // dashboard's own tracking fields (featured status, story collected,
      // career updates, awards) are never touched by an import.
      const writable: Record<string, string | number> = {};
      for (const [field, value] of Object.entries(row.data)) {
        if (value !== null && value !== "") writable[field] = value;
      }

      if (action === "update" && existingId) {
        await prisma.alumnus.update({
          where: { id: existingId },
          data: writable,
        });
        updated += 1;
      } else {
        await prisma.alumnus.create({
          data: {
            ...writable,
            firstName: row.data.firstName,
          },
        });
        created += 1;
      }
    }

    revalidatePath("/alumni");
    revalidatePath("/");

    return { stage: "done", created, updated, skipped };
  }

  return { stage: "error", message: "Unrecognized action." };
}
