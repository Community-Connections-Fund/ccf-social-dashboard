import Link from "next/link";
import { notFound } from "next/navigation";
import { AlumnusForm } from "@/components/alumnus-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canViewContactInfo, type Role } from "@/lib/workflow";
import { updateAlumnus } from "../../actions";

export default async function EditAlumnusPage({
  params,
}: PageProps<"/alumni/[id]/edit">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const showContact = canViewContactInfo(user.role as Role);

  const person = await prisma.alumnus.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cohortYear: true,
      currentOrganization: true,
      currentRole: true,
      boardMemberships: true,
      linkedin: true,
      careerUpdates: true,
      awards: true,
      storyCollected: true,
      featuredStatus: true,
      personalEmail: showContact,
      workEmail: showContact,
    },
  });

  if (!person) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/alumni/${person.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to record
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit alum</h1>

      <div className="mt-6">
        <AlumnusForm
          action={updateAlumnus}
          values={person}
          showContact={showContact}
          submitLabel="Save changes"
          cancelHref={`/alumni/${person.id}`}
        />
      </div>
    </div>
  );
}
