export type NameParts = {
  firstName: string;
  lastName: string | null;
};

export function alumnusDisplayName(person: NameParts): string {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export type SplitNameResult = NameParts & { warnings: string[] };

// Names do not split reliably, so this uses the least-surprising rules and
// reports what it assumed instead of guessing silently:
//   "Jane Doe"           -> Jane / Doe
//   "Jane van der Berg"  -> Jane / van der Berg   (surname keeps every later word)
//   "Doe, Jane"          -> Jane / Doe            (comma means "Last, First")
//   "Cher"               -> Cher / null           (flagged)
export function splitFullName(raw: string): SplitNameResult {
  const warnings: string[] = [];
  const value = raw.trim().replace(/\s+/g, " ");

  if (!value) {
    return { firstName: "", lastName: null, warnings };
  }

  if (value.includes(",")) {
    const [surname, ...rest] = value.split(",");
    const given = rest.join(",").trim();
    warnings.push('Contains a comma — read as "Last, First".');

    if (!given) {
      return { firstName: surname.trim(), lastName: null, warnings };
    }
    return { firstName: given, lastName: surname.trim() || null, warnings };
  }

  const words = value.split(" ");

  if (words.length === 1) {
    warnings.push("Only one word — no surname recorded.");
    return { firstName: words[0], lastName: null, warnings };
  }

  if (words.length > 2) {
    warnings.push(
      `Assumed surname "${words.slice(1).join(" ")}" — check if this has a middle name.`,
    );
  }

  return {
    firstName: words[0],
    lastName: words.slice(1).join(" "),
    warnings,
  };
}
