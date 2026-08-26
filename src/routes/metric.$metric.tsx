import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Minus, Share2, Stethoscope } from "lucide-react";
import { METRICS, METRIC_ORDER, STATUS_META, type MetricKey } from "@/lib/igloo-data";
import { useLatest } from "@/lib/igloo-store";
import {
  average,
  DOCTOR_NOTE,
  METRIC_DETAIL,
  numericValue,
  RANGE_LABEL,
  RANGES,
  rollingAverage,
  seriesFor,
  zoneFor,
  type RangeKey,
} from "@/lib/igloo-metric-detail";
import { MetricIcon, PulseLine, StatusBadge } from "@/components/igloo/ui";
import { Tortoise } from "@/components/igloo/Tortoise";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/metric/$metric")({
  params: {
    parse: (raw) => {
      if (!METRIC_ORDER.includes(raw.metric as MetricKey)) throw notFound();
      return raw;
    },
  },
  head: ({ params }) => {
    const label = METRICS[params.metric as MetricKey]?.label ?? "Metric";
    return {
      meta: [
        { title: `${label} — Igloo` },
        {
          name: "description",
          content: `Your ${label.toLowerCase()} readings: reference ranges, baseline, trends and plain-language notes.`,
        },
        { property: "og:title", content: `${label} — Igloo` },
        {
          property: "og:description",
          content: `Your ${label.toLowerCase()} readings, trends and reference ranges.`,
        },
      ],
    };
  },
  component: MetricDetailPage,
  notFoundComponent: MetricNotFound,
});

function MetricNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Metric not found</h1>
      <Link to="/" className="text-base font-bold text-primary underline">
        Back to home
      </Link>
    </main>
  );
}

function MetricDetailPage() {
  const { metric } = Route.useParams();
  const m = metric as MetricKey;
  const meta = METRICS[m];
  const detail = METRIC_DETAIL[m];
  const router = useRouter();
  const latest = useLatest();
  const reading = latest[m];

  const current = numericValue(m, reading?.value);
  const zone = zoneFor(m, current);
  const status = reading?.status ?? "good";
  const [range, setRange] = useState<RangeKey>("1M");

  const series = useMemo(() => seriesFor(m, range, current), [m, range, current]);
  const smoothed = useMemo(() => rollingAverage(series, 5), [series]);
  const periodAvg = average(series);
  const diffFromAvg = current - periodAvg;

  const changes = useMemo(() => {
    const defs = [
      { label: "7 days", window: 7 },
      { label: "14 days", window: 14 },
      { label: "30 days", window: 30 },
    ];
    return defs.map((d) => {
      const w = seriesFor(m, "1M", current).slice(-d.window);
      const delta = w[w.length - 1]! - w[0]!;
      return { ...d, data: w, delta };
    });
  }, [m, current]);

  return (
    <main className="pb-6">
      {/* 1. Header */}
      <header className="flex items-center gap-2 px-4 pt-6 pb-1">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Back"
          className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="flex-1 text-xl font-bold tracking-tight text-foreground">{meta.label}</h1>
        <button
          type="button"
          aria-label={`Share ${meta.label} chart`}
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <Share2 className="size-5" />
        </button>
      </header>
      <div className="px-5">
        <PulseLine className="mt-1 h-3.5 w-32" />
      </div>

      <div className="space-y-5 px-5 pt-5">
        {/* 2. Current reading + mascot */}
        <section className="card-igloo flex items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <MetricIcon metric={m} />
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Latest {detail.readsAs ? `· ${detail.readsAs}` : ""}
              </p>
            </div>
            <p className="mt-3 font-serif text-[44px] leading-none tracking-tight text-foreground">
              {reading?.value ?? "—"}
              <span className="ml-1.5 font-sans text-sm font-semibold text-muted-foreground">
                {meta.unit}
              </span>
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {reading?.at ?? "No readings yet"}
            </p>
            <StatusBadge status={status} className="mt-3" />
          </div>
          <Tortoise status={status} size="lg" />
        </section>

        {/* 3. Reference range gauge */}
        <section className="card-igloo p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-foreground">Reference ranges</h2>
            <p className={cn("text-xs font-bold", STATUS_META[zone.status].text)}>{zone.name}</p>
          </div>
          <Gauge metric={m} current={current} />
        </section>

        {/* 4. Personal baseline */}
        <section className="card-igloo grid grid-cols-2 gap-4 p-5">
          <div>
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Your average
            </p>
            <p className="mt-1.5 font-serif text-[28px] leading-none text-foreground">
              {Math.round(periodAvg)}
              <span className="ml-1 font-sans text-xs font-semibold text-muted-foreground">
                {meta.unit}
              </span>
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              over {RANGE_LABEL[range]}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Latest vs average
            </p>
            <p className="mt-1.5 flex items-center gap-1 font-serif text-[28px] leading-none text-foreground">
              <DeltaArrow delta={diffFromAvg} className="size-5" />
              {diffFromAvg > 0 ? "+" : ""}
              {Math.round(diffFromAvg)}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {meta.unit} from your latest reading
            </p>
          </div>
        </section>

        {/* 5. Trend chart */}
        <section className="card-igloo p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Trend</h2>
            <RangeSelect value={range} onChange={setRange} />
          </div>
          <TrendChart data={series} smooth={smoothed} metric={m} />
          <div className="mt-3 flex items-center gap-5 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn("inline-block h-0.5 w-5 rounded-full", meta.color)} />
              Readings
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={cn("inline-block h-0.5 w-5 rounded-full", meta.color)}
                style={{ opacity: 0.45 }}
              />
              Rolling average
            </span>
          </div>
        </section>

        {/* 6. Recent changes */}
        <section className="card-igloo divide-y divide-border overflow-hidden">
          <h2 className="p-5 pb-3 text-base font-bold text-foreground">Recent changes</h2>
          {changes.map((c) => (
            <div key={c.label} className="flex items-center gap-4 px-5 py-4">
              <p className="w-16 text-sm font-bold text-foreground">{c.label}</p>
              <MiniSpark data={c.data} metric={m} className="h-8 flex-1" />
              <p className="flex w-24 items-center justify-end gap-1 text-sm font-bold text-foreground">
                <DeltaArrow delta={c.delta} className="size-4" />
                {c.delta > 0 ? "+" : ""}
                {Math.round(c.delta)}
                <span className="ml-0.5 text-[11px] font-semibold text-muted-foreground">
                  {meta.unit}
                </span>
              </p>
            </div>
          ))}
        </section>

        {/* 7. About */}
        <section className="card-igloo p-5">
          <h2 className="text-base font-bold text-foreground">About {meta.label.toLowerCase()}</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{detail.about}</p>
        </section>

        {/* 8. Tips */}
        <section className="card-igloo p-5">
          <h2 className="text-base font-bold text-foreground">Tips</h2>
          <ul className="mt-3 space-y-3">
            {detail.tips.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", meta.color)} />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary-tint p-4">
            <Stethoscope className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed font-semibold text-accent-foreground">
              {DOCTOR_NOTE}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function DeltaArrow({ delta, className }: { delta: number; className?: string }) {
  if (delta >= 0.5) return <ArrowUpRight className={cn("text-watch", className)} />;
  if (delta <= -0.5) return <ArrowDownRight className={cn("text-good", className)} />;
  return <Minus className={cn("text-muted-foreground", className)} />;
}

function RangeSelect({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div
      className="flex rounded-full border border-border bg-background p-1"
      role="group"
      aria-label="Time range"
    >
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "min-h-[32px] rounded-full px-2.5 text-xs font-bold transition-colors",
            value === r ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function Gauge({ metric, current }: { metric: MetricKey; current: number }) {
  const d = METRIC_DETAIL[metric];
  const meta = METRICS[metric];
  const span = d.max - d.min;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - d.min) / span) * 100));

  // Determine which zone the current value falls into
  const currentZone = zoneFor(metric, current);

  // Assign zone labels to staggered rows so neighbours never overlap.
  const placed: number[][] = [[], [], []];
  const rows = d.zones.map((z) => {
    const mid = (pct(z.from) + pct(z.to)) / 2;
    for (let r = 0; r < 3; r++) {
      if (placed[r]!.every((p) => Math.abs(p - mid) > 17)) {
        placed[r]!.push(mid);
        return { z, mid, row: r };
      }
    }
    return { z, mid, row: -1 };
  });
  const labelRows = rows.filter((r) => r.row >= 0);
  const rowCount = Math.max(1, ...labelRows.map((r) => r.row + 1));

  return (
    <div className="mt-4">
      <div className="relative h-5 w-full">
        <div className="absolute inset-x-0 top-1 flex h-3 overflow-hidden rounded-full">
          {d.zones.map((z) => (
            <div
              key={z.name}
              className={cn(
                "h-full",
                z.status === "good" ? "bg-good" : z.status === "watch" ? "bg-watch" : "bg-urgent",
              )}
              style={{ width: `${pct(z.to) - pct(z.from)}%` }}
            />
          ))}
        </div>
        {d.target ? (
          <div
            className="absolute top-0 h-5 rounded-full border-2 border-primary/70"
            style={{
              left: `${pct(d.target.from)}%`,
              width: `${pct(d.target.to) - pct(d.target.from)}%`,
            }}
          />
        ) : null}
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card shadow-[var(--shadow-soft)]"
          style={{
            left: `${pct(current)}%`,
            backgroundColor:
              currentZone.status === "good"
                ? "var(--good)"
                : currentZone.status === "watch"
                  ? "var(--watch)"
                  : "var(--urgent)",
          }}
        />
      </div>
      <div
        className="relative mt-2 text-[11px] leading-snug font-bold text-muted-foreground"
        style={{ height: `${rowCount * 18 + 14}px` }}
      >
        {labelRows.map(({ z, mid, row }) => (
          <span
            key={z.name}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${Math.min(88, Math.max(12, mid))}%`, top: row * 18 }}
          >
            {z.name}
          </span>
        ))}
        <span className="absolute left-0" style={{ top: (rowCount - 1) * 18 + 16 }}>
          {d.min}
        </span>
        <span className="absolute right-0" style={{ top: (rowCount - 1) * 18 + 16 }}>
          {d.max}
        </span>
      </div>
      {d.target ? (
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          Outlined band: your personal target ({d.target.from}–{d.target.to} {meta.unit}) from
          Profile.
        </p>
      ) : null}
    </div>
  );
}

function TrendChart({
  data,
  smooth,
  metric,
}: {
  data: number[];
  smooth: number[];
  metric: MetricKey;
}) {
  const W = 320;
  const H = 150;
  const PAD = 10;
  const all = [...data, ...smooth];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const px = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const py = (v: number) => H - 12 - ((v - min) / span) * (H - 36);
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(2)} ${py(v).toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-44 w-full" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={W - PAD}
          y1={H * f}
          y2={H * f}
          strokeWidth="1"
          style={{ stroke: "var(--border)" }}
        />
      ))}
      <path
        d={`${path(data)} L${px(data.length - 1).toFixed(2)} ${H} L${px(0).toFixed(2)} ${H} Z`}
        style={{ fill: `var(--${metric}-tint)` }}
      />
      <path
        d={path(smooth)}
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        style={{ stroke: `var(--${metric})` }}
      />
      <path
        d={path(data)}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: `var(--${metric})` }}
      />
      {data.map((v, i) =>
        i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0 ? (
          <circle key={i} cx={px(i)} cy={py(v)} r="2.4" style={{ fill: `var(--${metric})` }} />
        ) : null,
      )}
      <circle
        cx={px(data.length - 1)}
        cy={py(data[data.length - 1]!)}
        r="4.5"
        strokeWidth="2"
        style={{ fill: `var(--${metric})`, stroke: "var(--card)" }}
      />
    </svg>
  );
}

function MiniSpark({
  data,
  metric,
  className,
}: {
  data: number[];
  metric: MetricKey;
  className?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const line = data
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${((i / (data.length - 1)) * 100).toFixed(2)} ${(26 - ((v - min) / span) * 20).toFixed(2)}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        d={line}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: `var(--${metric})` }}
      />
    </svg>
  );
}
