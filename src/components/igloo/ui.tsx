import { Activity, Droplet, HeartPulse, Wind } from "lucide-react";
import type { ComponentType } from "react";
import { METRICS, STATUS_META, type MetricKey, type Status } from "@/lib/igloo-data";
import { cn } from "@/lib/utils";

export const METRIC_ICONS: Record<MetricKey, ComponentType<{ className?: string }>> = {
  bp: Activity,
  hr: HeartPulse,
  ox: Wind,
  glu: Droplet,
};

/** Signature motif: thin rule with a single ECG blip. */
export function PulseLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 18"
      preserveAspectRatio="none"
      className={cn("h-4 w-full text-primary", className)}
      aria-hidden="true"
    >
      <path
        d="M0 12 H92 L98 12 L103 4 L108 16 L113 9 L118 12 H240"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="px-5 pt-8 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          {subtitle ? (
            <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
          ) : null}
          <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {right}
      </div>
      <PulseLine className="mt-4 h-3.5 w-32" />
    </header>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function MetricIcon({ metric, size = "md" }: { metric: MetricKey; size?: "md" | "lg" }) {
  const Icon = METRIC_ICONS[metric];
  const m = METRICS[metric];
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full",
        m.tint,
        size === "lg" ? "size-14" : "size-11",
      )}
    >
      <Icon className={cn(m.text, size === "lg" ? "size-7" : "size-5")} />
    </span>
  );
}

export function Sparkline({
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
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 30 - ((v - min) / span) * 24 - 3;
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L100 30 L0 30 Z`;
  const last = pts[pts.length - 1] ?? ([0, 0] as const);

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn("h-14 w-full", METRICS[metric].text, className)}
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="1.8"
        fill="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function BigNumber({
  value,
  unit,
  className,
}: {
  value: string;
  unit: string;
  className?: string;
}) {
  return (
    <p className={cn("font-serif leading-none tracking-tight text-foreground", className)}>
      {value}
      <span className="ml-1.5 font-sans text-xs font-semibold text-muted-foreground">{unit}</span>
    </p>
  );
}
