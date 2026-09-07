"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importAlumni, type ImportState } from "./actions";

const INITIAL: ImportState = { stage: "idle" };

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  update: "bg-sky-100 text-sky-800 ring-sky-200",
  duplicate: "bg-amber-100 text-amber-800 ring-amber-200",
  skip: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function ImportForm() {
  const [state, action, pending] = useActionState(importAlumni, INITIAL);

  if (state.stage === "done") {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-medium text-slate-900">Import complete</h2>
        <p className="mt-2 text-sm text-slate-600">
          {state.created} added · {state.updated} updated · {state.skipped}{" "}
          skipped
        </p>
        <Link
          href="/alumni"
          className="mt-4 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          View alumni
        </Link>
      </div>
    );
  }

  if (state.stage === "preview") {
    const { totals } = state;
    return (
      <div className="mt-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium text-slate-900">
            Nothing has been saved yet
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {totals.create} to add · {totals.update} to update ·{" "}
            {totals.duplicate} duplicate in file · {totals.skip} unusable
          </p>

          {state.unmappedHeaders.length > 0 ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Columns that will be ignored:{" "}
              {state.unmappedHeaders.join(", ")}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <form action={action}>
              <input type="hidden" name="intent" value="commit" />
              <input type="hidden" name="csvText" value={state.csvText} />
              <button
                type="submit"
                disabled={pending || totals.create + totals.update === 0}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
              >
                {pending
                  ? "Importing…"
                  : `Import ${totals.create + totals.update} records`}
              </button>
            </form>
            <Link
              href="/alumni/import"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Start over
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Row</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.rows.map((row) => (
                <tr key={row.rowNumber}>
                  <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.organization ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.cohortYear ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ACTION_STYLES[row.action]}`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {[row.error, ...row.warnings].filter(Boolean).join(" ") ||
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totals.create + totals.update + totals.skip + totals.duplicate >
        state.rows.length ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing the first {state.rows.length} rows of{" "}
            {totals.create + totals.update + totals.skip + totals.duplicate}.
            All of them will be imported.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 max-w-xl">
      <input type="hidden" name="intent" value="preview" />

      <label
        htmlFor="file"
        className="block text-sm font-medium text-slate-700"
      >
        Alumni CSV
      </label>
      <input
        id="file"
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
      />

      {state.stage === "error" ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
      >
        {pending ? "Reading…" : "Preview import"}
      </button>
    </form>
  );
}
