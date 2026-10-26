import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getPlatformSettings } from "@/lib/settings";
import { getPaymentProvider } from "@/lib/payments";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, PanelHeader } from "@/components/ui/card";
import { FlagToggle, PlanEditor, PlatformSettingsForm } from "@/components/admin/settings-forms";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings & pricing" };

export default async function AdminSettingsPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const [settings, flags, plans] = await Promise.all([getPlatformSettings(), db.featureFlag.findMany({ orderBy: { key: "asc" } }), db.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } })]);
  const provider = getPaymentProvider();
  return (
    <>
      <PageHeader title="Settings & pricing" description="Platform economics, feature flags and membership configuration. Every change is audit-logged." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Commission & payouts" />
          <div className="p-5 sm:p-6"><PlatformSettingsForm {...settings} /></div>
        </Panel>
        <Panel>
          <PanelHeader title="Feature flags" />
          <div className="divide-y divide-white/[0.05] px-5 pb-3 sm:px-6">{flags.map((f) => <FlagToggle key={f.key} flagKey={f.key} enabled={f.enabled} description={f.description} />)}</div>
        </Panel>
      </div>
      <Panel className="mt-6">
        <PanelHeader title="Payment provider" description="Configured through environment variables only — secrets are never sent to the browser." />
        <div className="flex flex-wrap items-center gap-3 p-5 text-sm sm:p-6">
          <span className="text-mist">Active provider:</span> <span className="font-mono text-ivory">{provider.name}</span>
          {provider.sandbox ? <Badge tone="violet">sandbox</Badge> : <Badge tone="success">live</Badge>}
          <span className="text-xs text-fog">Set PAYMENT_PROVIDER=razorpay with RAZORPAY_* keys after merchant approval.</span>
        </div>
      </Panel>
      <h2 className="mt-10 mb-4 text-[15px] font-semibold text-ivory">Membership pricing</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map((p) => <PlanEditor key={p.code} plan={p} />)}</div>
    </>
  );
}
