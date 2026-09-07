import Link from "next/link";
import { Field, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { alumnusDisplayName } from "@/lib/alumni";
import { toDateInputValue } from "@/lib/dates";
import {
  GRAPHIC_STATUSES,
  GRAPHIC_STATUS_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
} from "@/lib/workflow";

export type PostFormValues = {
  id?: string;
  title: string;
  caption: string | null;
  graphicUrl: string | null;
  platform: string | null;
  graphicStatus: string;
  publishDate: Date | null;
  contentPillarId: string | null;
  alumnusId: string | null;
  reach?: number | null;
  engagement?: number | null;
  clicks?: number | null;
};

export function PostForm({
  action,
  values,
  pillars,
  alumni,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: PostFormValues;
  pillars: Array<{ id: string; name: string }>;
  alumni: Array<{ id: string; firstName: string; lastName: string | null }>;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id ? (
        <input type="hidden" name="postId" value={values.id} />
      ) : null}

      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          required
          className={inputClass}
          placeholder="Alumni Spotlight — Jane Doe"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Publish date" htmlFor="publishDate">
          <input
            id="publishDate"
            name="publishDate"
            type="date"
            defaultValue={toDateInputValue(values.publishDate)}
            className={inputClass}
          />
        </Field>

        <Field label="Platform" htmlFor="platform">
          <select
            id="platform"
            name="platform"
            defaultValue={values.platform ?? ""}
            className={inputClass}
          >
            <option value="">Not set</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Content pillar" htmlFor="contentPillarId">
          <select
            id="contentPillarId"
            name="contentPillarId"
            defaultValue={values.contentPillarId ?? ""}
            className={inputClass}
          >
            <option value="">Not set</option>
            {pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.id}>
                {pillar.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="About which alum"
          htmlFor="alumnusId"
          hint="Links the post to the alumni archive."
        >
          <select
            id="alumnusId"
            name="alumnusId"
            defaultValue={values.alumnusId ?? ""}
            className={inputClass}
          >
            <option value="">Not about a specific alum</option>
            {alumni.map((person) => (
              <option key={person.id} value={person.id}>
                {alumnusDisplayName(person)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Graphic status" htmlFor="graphicStatus">
          <select
            id="graphicStatus"
            name="graphicStatus"
            defaultValue={values.graphicStatus}
            className={inputClass}
          >
            {GRAPHIC_STATUSES.map((status) => (
              <option key={status} value={status}>
                {GRAPHIC_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Graphic link"
          htmlFor="graphicUrl"
          hint="Canva or Drive link. Direct image links show in the preview."
        >
          <input
            id="graphicUrl"
            name="graphicUrl"
            type="url"
            defaultValue={values.graphicUrl ?? ""}
            className={inputClass}
            placeholder="https://drive.google.com/..."
          />
        </Field>
      </div>

      <Field label="Caption" htmlFor="caption">
        <textarea
          id="caption"
          name="caption"
          rows={8}
          defaultValue={values.caption ?? ""}
          className={inputClass}
          placeholder="Write the post exactly as it should go out."
        />
      </Field>

      {values.id ? (
        <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-medium text-slate-900">
            How it performed
          </legend>
          <p className="text-xs text-slate-500">
            Fill these in after the post goes out. They drive the top-performing
            list on Analytics. Leave blank if you have not checked yet.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["reach", "Reach", values.reach],
                ["engagement", "Engagement", values.engagement],
                ["clicks", "Clicks", values.clicks],
              ] as const
            ).map(([name, label, value]) => (
              <Field key={name} label={label} htmlFor={name}>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min={0}
                  defaultValue={value ?? ""}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" className={buttonClass}>
          {submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
