import { prisma } from "@/lib/prisma";
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
  type AssetCategory,
} from "@/lib/workflow";

export default async function AssetsPage() {
  const assets = await prisma.assetLink.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Asset Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          Links to the logos, photos, videos, and Canva templates that live in
          Google Drive.
        </p>
      </header>

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
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {items.map((asset) => (
                    <li key={asset.id}>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-700 underline underline-offset-2 hover:text-slate-900"
                      >
                        {asset.title}
                      </a>
                      {asset.notes ? (
                        <span className="text-slate-500"> — {asset.notes}</span>
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
