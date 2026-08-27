import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { IglooToggle } from "@/components/igloo/Toggle";
import { FAMILY, METRICS, METRIC_ORDER } from "@/lib/igloo-data";
import { useIgloo } from "@/lib/igloo-store";
import { MetricIcon, PageHeader, StatusBadge } from "@/components/igloo/ui";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family — Igloo" },
      {
        name: "description",
        content: "The people following along, and exactly which readings each of them can see.",
      },
      { property: "og:title", content: "Family — Igloo" },
      {
        property: "og:description",
        content: "The people following along, and exactly which readings they can see.",
      },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const { shared, toggleShared, simpleView } = useIgloo();

  // Simple view: large avatar + name + plain-language status only
  if (simpleView) {
    return (
      <main>
        <PageHeader title="Your family" subtitle="Sharing with 3 people" />
        <div className="space-y-5 px-5 pt-2">
          <div className="space-y-5">
            {FAMILY.map((f) => (
              <article key={f.id} className="rounded-[22px] bg-card border border-border p-6">
                <div className="flex items-start gap-5">
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary-tint font-serif text-2xl text-primary">
                    {f.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">{f.name}</h2>
                    <p className="mt-1 text-lg text-foreground leading-relaxed">
                      {f.status === "good"
                        ? `${f.name.split(" ")[0]} is doing fine today`
                        : `${f.name.split(" ")[0]} has a question about your readings`}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title="Your family" subtitle="Sharing with 3 people" />

      <div className="space-y-5 px-5 pt-2">
        <div className="space-y-4">
          {FAMILY.map((f) => (
            <article key={f.id} className="card-igloo p-4">
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint font-serif text-lg text-primary">
                  {f.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-foreground">{f.name}</h2>
                      <p className="text-sm font-semibold text-muted-foreground">{f.relation}</p>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => toast.success("Invitation link copied — send it to your family.")}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-sun text-base font-bold text-foreground transition-transform active:scale-[0.99]"
        >
          <UserPlus className="size-5" /> Invite a family member
        </button>

        <section className="card-igloo overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-base font-bold text-foreground">What they can see</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn off anything you&apos;d rather keep to yourself.
            </p>
          </div>
          <div className="divide-y divide-border">
            {METRIC_ORDER.map((m) => (
              <label
                key={m}
                className="flex min-h-[68px] cursor-pointer items-center gap-4 px-5 py-3"
              >
                <MetricIcon metric={m} />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    {METRICS[m].label}
                  </span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {shared[m] ? "Shared with your family" : "Private to you"}
                  </span>
                </span>
                <IglooToggle
                  checked={shared[m] ?? false}
                  onChange={() => toggleShared(m)}
                  label={`Share ${METRICS[m].label} with family`}
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
