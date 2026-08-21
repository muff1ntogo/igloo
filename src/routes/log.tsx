import { createFileRoute } from "@tanstack/react-router";
import { METRICS, type Reading } from "@/lib/igloo-data";
import { useIgloo } from "@/lib/igloo-store";
import { MetricIcon, PageHeader, StatusBadge } from "@/components/igloo/ui";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Your log — Igloo" },
      {
        name: "description",
        content: "Every reading you've taken, grouped by day, with how it was captured.",
      },
      { property: "og:title", content: "Your log — Igloo" },
      {
        property: "og:description",
        content: "Every reading you've taken, grouped by day, with how it was captured.",
      },
    ],
  }),
  component: LogPage,
});

function dayOf(at: string) {
  return at.split(" · ")[0] ?? "Earlier";
}

function timeOf(at: string) {
  return at.split(" · ")[1] ?? "";
}

function LogPage() {
  const { readings } = useIgloo();

  const groups: { day: string; items: Reading[] }[] = [];
  for (const r of readings) {
    const day = dayOf(r.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(r);
    else groups.push({ day, items: [r] });
  }

  return (
    <main>
      <PageHeader title="Your log" subtitle={`${readings.length} readings saved`} />

      <div className="space-y-6 px-5 pt-2">
        {groups.map((g) => (
          <section key={g.day}>
            <h2 className="px-1 pb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              {g.day}
            </h2>
            <div className="card-igloo divide-y divide-border overflow-hidden">
              {g.items.map((r) => (
                <div key={r.id} className="flex min-h-[76px] items-center gap-4 p-4">
                  <MetricIcon metric={r.metric} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {METRICS[r.metric].label}
                    </p>
                    <p className="font-serif text-xl leading-tight text-foreground">
                      {r.value}
                      <span className="ml-1 font-sans text-xs font-semibold text-muted-foreground">
                        {METRICS[r.metric].unit}
                      </span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {timeOf(r.at)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                        {r.method}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
