import Link from "next/link";
import {
  Field,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { toDateInputValue } from "@/lib/dates";

export type BankFormValues = {
  id?: string;
  idea: string;
  captionDraft: string | null;
  contentPillarId: string | null;
  performanceNotes: string | null;
  evergreen: boolean;
  graphicNeeded: boolean;
  lastPosted: Date | null;
};

export function BankForm({
  action,
  values,
  pillars,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: BankFormValues;
  pillars: Array<{ id: string; name: string }>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id ? (
        <input type="hidden" name="entryId" value={values.id} />
      ) : null}

      <Field label="Idea" htmlFor="idea">
        <input
          id="idea"
          name="idea"
          defaultValue={values.idea}
          required
          className={inputClass}
          placeholder="Why we exist"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
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

        <Field label="Last posted" htmlFor="lastPosted">
          <input
            id="lastPosted"
            name="lastPosted"
            type="date"
            defaultValue={toDateInputValue(values.lastPosted)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Caption draft" htmlFor="captionDraft">
        <textarea
          id="captionDraft"
          name="captionDraft"
          rows={7}
          defaultValue={values.captionDraft ?? ""}
          className={inputClass}
          placeholder="The reusable copy for this idea."
        />
      </Field>

      <Field label="Performance notes" htmlFor="performanceNotes">
        <textarea
          id="performanceNotes"
          name="performanceNotes"
          rows={3}
          defaultValue={values.performanceNotes ?? ""}
          className={inputClass}
          placeholder="What worked last time this went out."
        />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="evergreen"
            defaultChecked={values.evergreen}
            className="h-4 w-4 rounded border-slate-300"
          />
          Evergreen — can be reused any time
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="graphicNeeded"
            defaultChecked={values.graphicNeeded}
            className="h-4 w-4 rounded border-slate-300"
          />
          Needs a graphic
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={buttonClass}>
          {submitLabel}
        </button>
        <Link href="/content-bank" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
