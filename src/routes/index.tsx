import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  FileText,
  TriangleAlert,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  dayKeyOf,
  fullDateToday,
  localISO,
  METRICS,
  METRIC_ORDER,
  STATUS_META,
  TRENDS,
  DELTAS,
  type MetricKey,
  type Reading,
  type MedLog,
} from "@/lib/igloo-data";
import { useIgloo, useLatest, worstStatus } from "@/lib/igloo-store";
import { BigNumber, MetricIcon, PageHeader, Sparkline, StatusBadge } from "@/components/igloo/ui";
import { cn } from "@/lib/utils";
import { ReportSheet } from "@/components/igloo/ReportSheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today ??Igloo" },
      {
        name: "description",
        content:
          "Your vitals at a glance: blood pressure, heart rate, oxygen and glucose, with gentle status guidance.",
      },
      { property: "og:title", content: "Today ??Igloo" },
      {
        property: "og:description",
        content: "Your vitals at a glance, with gentle status guidance for you and your family.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { simpleView, alertDismissed, dismissAlert, readings, meds, openAdd } = useIgloo();
  const latest = useLatest();
  const [mode, setMode] = useState<"delta" | "status">("status");
  const [reportOpen, setReportOpen] = useState(false);

  const overall = worstStatus(METRIC_ORDER.map((m) => latest[m]?.status));
  const flagged = METRIC_ORDER.filter((m) => latest[m]?.status !== "good");

  // Last 7 day keys, oldest first, ending today.
  const week = useMemo(() => {
    const days: { key: string; letter: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: localISO(d).slice(0, 10),
        letter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      });
    }
    return days;
  }, []);

  const measurementDays = useMemo(() => new Set(readings.map((r) => dayKeyOf(r.at))), [readings]);
  const medicationDays = useMemo(() => new Set(meds.map((m) => dayKeyOf(m.at))), [meds]);

  return (
    <main>
      <PageHeader title="Good morning, Rosemary" subtitle={fullDateToday()} />

      <div className="space-y-5 px-5 pt-2">
        {simpleView ? (
          <SimpleDashboard
            overall={overall}
            flagged={flagged}
            alertDismissed={alertDismissed}
            dismissAlert={dismissAlert}
            latest={latest}
            readings={readings}
            meds={meds}
            openAdd={openAdd}
          />
        ) : (
          <>
            {flagged.length > 0 && !alertDismissed ? (
              <div className="flex items-start gap-3 rounded-[22px] border border-border bg-watch-tint p-4">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-watch" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {METRICS[flagged[0] as MetricKey].label} is worth a look
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    It came in a little higher than usual. Rest a few minutes and take it again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissAlert}
                  aria-label="Dismiss alert"
                  className="-m-2 flex size-11 items-center justify-center rounded-full text-muted-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">Your readings</h2>
              <div className="flex rounded-full border border-border bg-card p-1">
                {(["delta", "status"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "min-h-[36px] rounded-full px-3 text-xs font-bold transition-colors",
                      mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {m === "delta" ? "vs Yesterday" : "Status"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {METRIC_ORDER.map((m) => {
                const r = latest[m];
                const meta = METRICS[m];
                return (
                  <Link
                    key={m}
                    to="/metric/$metric"
                    params={{ metric: m }}
                    className="card-igloo flex flex-col gap-3 p-4"
                  >
                    <MetricIcon metric={m} />
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      {meta.label}
                    </p>
                    <BigNumber
                      value={r?.value ?? "—"}
                      unit={meta.unit}
                      className={m === "bp" ? "text-[26px]" : "text-[32px]"}
                    />
                    {mode === "status" ? (
                      <StatusBadge status={r?.status ?? "good"} className="self-start" />
                    ) : (
                      <p className="text-xs font-semibold text-muted-foreground">{DELTAS[m]}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        <section className="card-igloo p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-foreground">This week</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              {week.filter((d) => measurementDays.has(d.key) || medicationDays.has(d.key)).length}{" "}
              of 7 days logged
            </p>
          </div>
          <div className="mt-4 flex justify-between">
            {week.map((day, i) => {
              const hasMeasurement = measurementDays.has(day.key);
              const hasMedication = medicationDays.has(day.key);
              const count = (hasMeasurement ? 1 : 0) + (hasMedication ? 1 : 0);
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-sm font-bold",
                      count >= 2
                        ? "bg-primary text-primary-foreground"
                        : count > 0
                          ? "bg-primary-tint text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count > 0 ? count : "—"}
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {day.letter}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Trends, last 7 days</h2>
          <div className="grid grid-cols-2 gap-4">
            {(["bp", "glu"] as MetricKey[]).map((m) => (
              <Link key={m} to="/metric/$metric" params={{ metric: m }} className="card-igloo p-4">
                <p className="text-xs font-bold text-muted-foreground">{METRICS[m].label}</p>
                <p className={cn("mt-1 text-sm font-bold", METRICS[m].text)}>
                  {TRENDS[m][TRENDS[m].length - 1]} {METRICS[m].unit}
                </p>
                <Sparkline data={TRENDS[m]} metric={m} className="mt-3" />
              </Link>
            ))}
          </div>
        </section>

        <Link
          to="/log"
          className="card-igloo flex min-h-[60px] items-center justify-between px-5 text-base font-bold text-foreground"
        >
          See your full log
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="card-igloo flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-tint">
              <FileText className="size-6 text-primary" />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">Generate Report</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a health summary PDF for your doctor
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </div>

      <ReportSheet open={reportOpen} onOpenChange={setReportOpen} />
    </main>
  );
}

function SimpleDashboard({
  overall,
  flagged,
  alertDismissed,
  dismissAlert,
  latest,
  readings,
  meds,
  openAdd,
}: {
  overall: "good" | "watch" | "urgent";
  flagged: MetricKey[];
  alertDismissed: boolean;
  dismissAlert: () => void;
  latest: Record<MetricKey, Reading | undefined>;
  readings: Reading[];
  meds: MedLog[];
  openAdd: () => void;
}) {
  const meta = STATUS_META[overall];

  // Calculate weekly consistency
  const weekKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekKeys.push(localISO(d).slice(0, 10));
  }
  const loggedDays = new Set([
    ...readings.map((r) => dayKeyOf(r.at)),
    ...meds.map((m) => dayKeyOf(m.at)),
  ]);
  const daysLogged = weekKeys.filter((k) => loggedDays.has(k)).length;

  // Generate plain-language status sentence
  let statusSentence = "";
  if (overall === "good") {
    statusSentence = "Everything looks good today";
  } else if (flagged.length === 1 && flagged[0]) {
    const metricLabel = METRICS[flagged[0]].label.toLowerCase();
    statusSentence = `Your ${metricLabel} was a bit high yesterday`;
  } else {
    statusSentence = "A few readings need attention";
  }

  // Get mascot emoji based on overall status
  const mascot = overall === "good" ? "😊" : overall === "watch" ? "😐" : "😟";

  return (
    <div className="space-y-6 px-5 pt-2">
      {/* Alert banner at top if needed - larger type scale */}
      {flagged.length > 0 && !alertDismissed ? (
        <div className="rounded-[22px] border border-border bg-watch-tint p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="mt-1 size-7 shrink-0 text-watch" />
            <div className="flex-1">
              <p className="text-xl font-bold text-foreground leading-relaxed">
                {METRICS[flagged[0] as MetricKey].label} needs attention
              </p>
              <p className="mt-2 text-lg text-foreground leading-relaxed">
                It came in a little higher than usual. Rest a few minutes and take it again.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissAlert}
              aria-label="Dismiss alert"
              className="-m-2 flex size-14 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Greeting, date, and large mascot */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-6xl" aria-hidden="true">
            {mascot}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">Good morning, Rosemary</h1>
        <p className="text-xl text-foreground">{fullDateToday()}</p>
      </div>

      {/* One big plain-language status line */}
      <div className="rounded-[22px] bg-primary-tint p-6 text-center">
        <p className="text-2xl font-semibold text-foreground leading-relaxed">{statusSentence}</p>
      </div>

      {/* One dominant, full-width "Log a Reading" button */}
      <button
        type="button"
        onClick={() => openAdd()}
        className="block rounded-[22px] bg-primary px-8 py-6 text-center transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/20">
            <MessageSquare className="size-5 text-primary-foreground" />
          </span>
          <span className="text-2xl font-bold text-primary-foreground">Log a Reading</span>
        </div>
      </button>

      {/* Weekly consistency as one plain sentence */}
      <div className="rounded-[22px] bg-card border border-border p-6 text-center">
        <p className="text-xl font-semibold text-foreground leading-relaxed">
          You've logged {daysLogged} of the last 7 days
        </p>
      </div>

      {/* Back navigation to full view hint */}
      <p className="text-center text-lg text-foreground">
        <span className="underline decoration-dotted">Tap to see detailed readings</span>
      </p>
    </div>
  );
}
