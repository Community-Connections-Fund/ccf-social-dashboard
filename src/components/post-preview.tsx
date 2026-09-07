import {
  GRAPHIC_STATUS_LABELS,
  PLATFORM_LABELS,
  type GraphicStatus,
  type Platform,
} from "@/lib/workflow";

// An approximation of how the post will read once it is out in the world. It is
// deliberately not pixel-perfect to any platform — the point is to see the
// caption in something shaped like a post instead of a table cell.
export function PostPreview({
  platform,
  caption,
  graphicStatus,
  imageUrl,
}: {
  platform: string | null;
  caption: string | null;
  graphicStatus: string;
  imageUrl?: string | null;
}) {
  const platformLabel = platform
    ? PLATFORM_LABELS[platform as Platform]
    : "No platform set";
  const imageFirst = platform !== "LINKEDIN";

  // A Google Drive or Canva share link is a web page, not an image file, so
  // dropping it into <img> renders a broken icon. Embed only what actually looks
  // like an image and offer everything else as a link.
  const isDirectImage = imageUrl
    ? /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(imageUrl)
    : false;

  const image = (
    <div className="flex aspect-square w-full items-center justify-center border-y border-slate-200 bg-slate-50">
      {isDirectImage && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="px-6 text-center">
          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-700 underline underline-offset-2"
            >
              Open graphic ↗
            </a>
          ) : (
            <p className="text-sm font-medium text-slate-500">No graphic yet</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {GRAPHIC_STATUS_LABELS[graphicStatus as GraphicStatus]}
          </p>
        </div>
      )}
    </div>
  );

  const body = (
    <div className="px-4 py-3">
      {caption ? (
        <p className="whitespace-pre-wrap text-sm text-slate-800">{caption}</p>
      ) : (
        <p className="text-sm italic text-slate-400">
          No caption written yet.
        </p>
      )}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          CCF
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            Community Connections Fund
          </p>
          <p className="text-xs text-slate-500">{platformLabel}</p>
        </div>
      </div>

      {imageFirst ? (
        <>
          {image}
          {body}
        </>
      ) : (
        <>
          {body}
          {image}
        </>
      )}
    </div>
  );
}
