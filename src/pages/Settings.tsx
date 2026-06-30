import { useState } from "react";

export default function Settings() {
  const [orgName, setOrgName] = useState("Hartley Property Holdings");
  const [reminderDay, setReminderDay] = useState("3");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Organisation" desc="Used on quarterly pack exports and accountant invites.">
        <Field label="Organisation name">
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-card w-full text-sm" />
        </Field>
        <Field label="Your role">
          <select className="h-10 px-3 rounded-lg border border-border bg-card w-full text-sm">
            <option>Owner</option>
            <option>Property manager</option>
            <option>Bookkeeper</option>
          </select>
        </Field>
      </Section>

      <Section title="Notifications" desc="Choose how and when you hear from Ledgerless HMO.">
        <Toggle label="Email notifications" desc="Daily summary of items needing review."
          checked={emailNotif} onChange={setEmailNotif} />
        <Toggle label="SMS reminders" desc="For urgent overdue rent and expired documents."
          checked={smsNotif} onChange={setSmsNotif} />
        <Toggle label="Weekly readiness digest" desc="Sent every Monday morning."
          checked={weeklyDigest} onChange={setWeeklyDigest} />
      </Section>

      <Section title="Rent reminders" desc="When to send tenants a polite reminder before rent is due.">
        <Field label="Default rent reminder day">
          <select value={reminderDay} onChange={(e) => setReminderDay(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-card w-full text-sm">
            <option value="1">1 day before due</option>
            <option value="3">3 days before due</option>
            <option value="7">7 days before due</option>
            <option value="0">Don't send reminders</option>
          </select>
        </Field>
      </Section>

      <Section title="Accountant access" desc="Invite your accountant to view quarterly packs.">
        <div className="rounded-lg border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">Accountant invites will be available soon.</p>
          <button disabled className="mt-3 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed">
            Invite accountant
          </button>
        </div>
      </Section>

      <Section title="Data export" desc="Download a full copy of your property records.">
        <div className="rounded-lg border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">Data export will be available soon.</p>
          <button disabled className="mt-3 h-9 px-3.5 rounded-lg border border-border text-sm font-medium opacity-50 cursor-not-allowed">
            Export everything
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-6">
      <header className="mb-4">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${checked ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 ${checked ? "left-6" : "left-0.5"} size-5 bg-card rounded-full shadow transition-all`} />
      </button>
    </div>
  );
}
