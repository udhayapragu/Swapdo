import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, PanelHeader } from "@/components/ui/card";
import { PasswordForm, ProfileForm, SignOutEverywhere } from "@/components/dashboard/settings-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const [row, sessions] = await Promise.all([db.user.findUniqueOrThrow({ where: { id: user.id } }), db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } })]);
  return (
    <>
      <PageHeader title="Settings" description="Your profile and security." />
      <div className="max-w-3xl space-y-6">
        <Panel>
          <PanelHeader title="Profile" description={`${row.email} · member since ${formatDate(row.createdAt)}`} />
          <div className="p-5 sm:p-6"><ProfileForm name={row.name} /></div>
        </Panel>
        <Panel>
          <PanelHeader title="Password" />
          <div className="p-5 sm:p-6"><PasswordForm /></div>
        </Panel>
        <Panel>
          <PanelHeader title="Sessions" description={`${sessions} active session${sessions === 1 ? "" : "s"}. Sessions use secure, HTTP-only cookies and expire after 30 days.`} />
          <div className="p-5 sm:p-6"><SignOutEverywhere /></div>
        </Panel>
        <Panel>
          <PanelHeader title="Connected services" description="SWAPDO never asks for or stores passwords to third-party services. Rentals use official APIs, OAuth or provider-issued tokens that expire with your rental." />
          <div className="p-5 sm:p-6" />
        </Panel>
      </div>
    </>
  );
}
