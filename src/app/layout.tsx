import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { signOutAction } from "@/app/login/actions";
import { ROLE_LABELS, type Role } from "@/lib/workflow";
import { getSessionUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CCF Social Media Dashboard",
  description:
    "Content calendar, approvals, alumni archive, and assets for Community Connections Fund.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Content Calendar" },
  { href: "/content-bank", label: "Content Bank" },
  { href: "/alumni", label: "Alumni" },
  { href: "/assets", label: "Asset Library" },
  { href: "/analytics", label: "Analytics" },
];

const ADMIN_NAV = [{ href: "/staff", label: "Staff access" }];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Not getCurrentUser(): that redirects to /login, and this layout wraps the
  // login page too, which would be an infinite redirect.
  const user = await getSessionUser();

  const shell = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 font-sans">
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );

  if (!user) return shell;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <div className="flex min-h-screen">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
            <div className="px-2">
              <p className="text-sm font-semibold text-slate-900">
                Community Connections Fund
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Social Media Dashboard
              </p>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {[...NAV, ...(user.role === "ADMIN" ? ADMIN_NAV : [])].map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="mt-auto border-t border-slate-200 px-2 pt-4">
              <p className="text-sm font-medium text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {ROLE_LABELS[user.role as Role] ?? user.role}
              </p>
              <form action={signOutAction} className="mt-3">
                <button
                  type="submit"
                  className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-slate-200 bg-white px-6 py-3 md:hidden">
              <nav className="flex flex-wrap gap-x-4 gap-y-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>

            <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
