import Link from "next/link";
import { notFound } from "next/navigation";
import { BankForm } from "@/components/bank-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@/lib/workflow";
import { deleteBankEntry, updateBankEntry } from "../../actions";

export default async function EditBankEntryPage({
  params,
}: PageProps<"/content-bank/[id]/edit">) {
  const { id } = await params;
  const [entry, pillars, user] = await Promise.all([
    prisma.contentBankEntry.findUnique({
      where: { id },
      select: {
        id: true,
        idea: true,
        captionDraft: true,
        contentPillarId: true,
        performanceNotes: true,
        evergreen: true,
        graphicNeeded: true,
        lastPosted: true,
      },
    }),
    prisma.contentPillar.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    getCurrentUser(),
  ]);

  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/content-bank"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Content Bank
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit entry</h1>

      <div className="mt-6">
        <BankForm
          action={updateBankEntry}
          values={entry}
          pillars={pillars}
          submitLabel="Save changes"
        />
      </div>

      {(user.role as Role) === "ADMIN" ? (
        <form
          action={deleteBankEntry}
          className="mt-10 border-t border-slate-200 pt-6"
        >
          <input type="hidden" name="entryId" value={entry.id} />
          <button
            type="submit"
            className="text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
          >
            Delete this entry
          </button>
        </form>
      ) : null}
    </div>
  );
}
