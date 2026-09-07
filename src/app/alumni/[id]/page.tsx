import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { secondaryButtonClass } from "@/components/ui";
import { alumnusDisplayName } from "@/lib/alumni";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  FEATURED_STATUS_LABELS,
  canViewContactInfo,
  type FeaturedStatus,
  type PostStatus,
  type Role,
} from "@/lib/workflow";

export default async function AlumnusPage({
  params,
}: PageProps<"/alumni/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const showContact = canViewContactInfo(user.role as Role);

  // The contact columns are left out of the query entirely for roles that may not
  // see them, so the data never reaches the render at all — not merely hidden.
  const person = await prisma.alumnus.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cohortYear: true,
      currentOrganization: true,
      currentRole: true,
      linkedin: true,
      boardMemberships: true,
      careerUpdates: true,
      awards: true,
      storyCollected: true,
      featuredStatus: true,
      personalEmail: showContact,
      workEmail: showContact,
      posts: {
        select: { id: true, title: true, status: true, publishDate: true },
        orderBy: { publishDate: "desc" },
      },
    },
  });

  if (!person) notFound();

  const facts: Array<[string, string]> = [
    ["Cohort year", person.cohortYear?.toString() ?? "—"],
    ["Organization", person.currentOrganization ?? "—"],
    ["Role", person.currentRole ?? "—"],
    ["Board memberships", person.boardMemberships ?? "—"],
    [
      "Spotlight status",
      FEATURED_STATUS_LABELS[person.featuredStatus as FeaturedStatus],
    ],
    ["Story", person.storyCollected ? "Collected" : "Not collected"],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/alumni"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Alumni
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {alumnusDisplayName(person)}
        </h1>
        <Link href={`/alumni/${person.id}/edit`} className={secondaryButtonClass}>
          Edit
        </Link>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <dl className="divide-y divide-slate-100 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-right font-medium text-slate-900">{value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-slate-500">LinkedIn</dt>
            <dd className="text-right">
              {person.linkedin ? (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-900 underline underline-offset-2"
                >
                  Profile
                </a>
              ) : (
                <span className="font-medium text-slate-900">—</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {showContact ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">
            Contact
            <span className="ml-2 font-normal text-slate-500">
              Visible to Admin and Editor only
            </span>
          </h2>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-slate-500">Work email</dt>
              <dd className="text-right font-medium text-slate-900">
                {person.workEmail ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-slate-500">Personal email</dt>
              <dd className="text-right font-medium text-slate-900">
                {person.personalEmail ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {person.careerUpdates || person.awards ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {person.careerUpdates ? (
            <>
              <h2 className="font-medium text-slate-900">Career updates</h2>
              <p className="mt-1 text-slate-700">{person.careerUpdates}</p>
            </>
          ) : null}
          {person.awards ? (
            <>
              <h2 className="mt-4 font-medium text-slate-900">Awards</h2>
              <p className="mt-1 text-slate-700">{person.awards}</p>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-500">Posts</h2>
        {person.posts.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            No posts linked to this alum yet.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {person.posts.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <span className="font-medium text-slate-900">{post.title}</span>
                <StatusBadge status={post.status as PostStatus} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
