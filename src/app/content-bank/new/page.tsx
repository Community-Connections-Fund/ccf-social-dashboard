import Link from "next/link";
import { BankForm } from "@/components/bank-form";
import { prisma } from "@/lib/prisma";
import { createBankEntry } from "../actions";
import { getCurrentUser } from "@/lib/session";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

export default async function NewBankEntryPage() {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  await getCurrentUser();

  const pillars = await prisma.contentPillar.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/content-bank"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Content Bank
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">New entry</h1>

      <div className="mt-6">
        <BankForm
          action={createBankEntry}
          pillars={pillars}
          submitLabel="Save entry"
          values={{
            idea: "",
            captionDraft: null,
            contentPillarId: null,
            performanceNotes: null,
            evergreen: true,
            graphicNeeded: false,
            lastPosted: null,
          }}
        />
      </div>
    </div>
  );
}
