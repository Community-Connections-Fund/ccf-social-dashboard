import Link from "next/link";
import {
  Field,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { FEATURED_STATUSES, FEATURED_STATUS_LABELS } from "@/lib/workflow";

export type AlumnusFormValues = {
  id?: string;
  firstName: string;
  lastName: string | null;
  cohortYear: number | null;
  currentOrganization: string | null;
  currentRole: string | null;
  boardMemberships: string | null;
  linkedin: string | null;
  personalEmail?: string | null;
  workEmail?: string | null;
  careerUpdates: string | null;
  awards: string | null;
  storyCollected: boolean;
  featuredStatus: string;
};

export function AlumnusForm({
  action,
  values,
  showContact,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: AlumnusFormValues;
  showContact: boolean;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id ? (
        <input type="hidden" name="alumnusId" value={values.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName">
          <input
            id="firstName"
            name="firstName"
            defaultValue={values.firstName}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Last name" htmlFor="lastName">
          <input
            id="lastName"
            name="lastName"
            defaultValue={values.lastName ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Cohort year" htmlFor="cohortYear">
          <input
            id="cohortYear"
            name="cohortYear"
            type="number"
            min={1900}
            max={2100}
            defaultValue={values.cohortYear ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Organization" htmlFor="currentOrganization">
          <input
            id="currentOrganization"
            name="currentOrganization"
            defaultValue={values.currentOrganization ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label="Role or title"
          htmlFor="currentRole"
          hint="Used in spotlight copy: “Jane Doe, CMO at Google”."
        >
          <input
            id="currentRole"
            name="currentRole"
            defaultValue={values.currentRole ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="LinkedIn" htmlFor="linkedin">
          <input
            id="linkedin"
            name="linkedin"
            defaultValue={values.linkedin ?? ""}
            className={inputClass}
            placeholder="https://linkedin.com/in/..."
          />
        </Field>
      </div>

      <Field label="Board memberships" htmlFor="boardMemberships">
        <input
          id="boardMemberships"
          name="boardMemberships"
          defaultValue={values.boardMemberships ?? ""}
          className={inputClass}
          placeholder="United Way, Girls Inc"
        />
      </Field>

      {showContact ? (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-slate-900">Contact</p>
            <p className="text-xs text-slate-500">
              Visible to Admin and Editor roles only.
            </p>
          </div>
          <Field label="Work email" htmlFor="workEmail">
            <input
              id="workEmail"
              name="workEmail"
              type="email"
              defaultValue={values.workEmail ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Personal email" htmlFor="personalEmail">
            <input
              id="personalEmail"
              name="personalEmail"
              type="email"
              defaultValue={values.personalEmail ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      ) : null}

      <Field label="Career updates" htmlFor="careerUpdates">
        <textarea
          id="careerUpdates"
          name="careerUpdates"
          rows={3}
          defaultValue={values.careerUpdates ?? ""}
          className={inputClass}
          placeholder="Promotions, new roles, moves worth posting about."
        />
      </Field>

      <Field label="Awards" htmlFor="awards">
        <textarea
          id="awards"
          name="awards"
          rows={2}
          defaultValue={values.awards ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Spotlight status" htmlFor="featuredStatus">
          <select
            id="featuredStatus"
            name="featuredStatus"
            defaultValue={values.featuredStatus}
            className={inputClass}
          >
            {FEATURED_STATUSES.map((status) => (
              <option key={status} value={status}>
                {FEATURED_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="storyCollected"
            defaultChecked={values.storyCollected}
            className="h-4 w-4 rounded border-slate-300"
          />
          Story collected
        </label>
      </div>

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
