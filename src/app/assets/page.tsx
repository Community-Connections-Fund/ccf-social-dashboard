import { Field, buttonClass, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
  type AssetCategory,
  type Role,
} from "@/lib/workflow";
import { addAsset, deleteAsset } from "./actions";

// This page reads live data. Without this, Next prerenders it at build time and
// the numbers never change again.
export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: PageProps<"/assets">) {
  // Every page resolves the session itself. proxy.ts is an optimistic redirect,
  // not access control, and a page must not be readable if it is bypassed.
  const user = await getCurrentUser();
  const canEdit = (user.role as Role) !== "VIEWER";

  const params = await searchParams;
  const preselected =
    typeof params.category === "string" &&
    (ASSET_CATEGORIES as readonly string[]).includes(params.category)
      ? params.category
      : "";

  const assets = await prisma.assetLink.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Asset Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          Links to the logos, photos, videos, and Canva templates that live in
          Google Drive. {assets.length} link{assets.length === 1 ? "" : "s"}.
        </p>
      </header>

      {canEdit ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-900">Add a link</h2>
          <form action={addAsset} className="mt-3 flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Name" htmlFor="title">
                <input
                  id="title"
                  name="title"
                  required
                  className={inputClass}
                  placeholder="2026 logo pack"
                />
              </Field>
              <Field label="Category" htmlFor="category">
                <select
                  id="category"
                  name="category"
                  defaultValue={preselected}
                  className={inputClass}
                >
                  {ASSET_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {ASSET_CATEGORY_LABELS[category as AssetCategory]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Notes"
                htmlFor="notes"
                hint="Optional — usage rules, who made it."
              >
                <input id="notes" name="notes" className={inputClass} />
              </Field>
            </div>

            <Field
              label="Google Drive link"
              htmlFor="url"
              hint="Right-click the file or folder in Drive, Share, Copy link."
            >
              <input
                id="url"
                name="url"
                type="url"
                required
                className={inputClass}
                placeholder="https://drive.google.com/..."
              />
            </Field>

            <div>
              <button type="submit" className={buttonClass}>
                Add link
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ASSET_CATEGORIES.map((category) => {
          const items = assets.filter((asset) => asset.category === category);

          return (
            <section
              key={category}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <h2 className="text-sm font-medium text-slate-900">
                {ASSET_CATEGORY_LABELS[category as AssetCategory]}
              </h2>

              {items.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No links yet.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {items.map((asset) => (
                    <li
                      key={asset.id}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-slate-900 underline underline-offset-2"
                        >
                          {asset.title}
                        </a>
                        {asset.notes ? (
                          <p className="text-xs text-slate-500">{asset.notes}</p>
                        ) : null}
                      </div>

                      {canEdit ? (
                        <form action={deleteAsset} className="shrink-0">
                          <input
                            type="hidden"
                            name="assetId"
                            value={asset.id}
                          />
                          <button
                            type="submit"
                            className="text-xs text-slate-400 hover:text-red-700"
                            title="Remove this link. The file in Drive is untouched."
                          >
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
