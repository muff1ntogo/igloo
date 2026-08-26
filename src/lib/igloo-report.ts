import {
  dayKeyOf,
  METRICS,
  METRIC_ORDER,
  STATUS_META,
  type MedLog,
  type MetricKey,
  type Reading,
} from "./igloo-data";
import { METRIC_DETAIL, numericValue } from "./igloo-metric-detail";

export type Period = "weekly" | "monthly";

export const PERIOD_DAYS: Record<Period, number> = { weekly: 7, monthly: 30 };

/** Hex values mirrored from the design tokens — react-pdf can't read CSS. */
export const PDF = {
  brand: "#186787",
  brandMid: "#2087A8",
  brandSoft: "#E3F1F5",
  ink: "#123247",
  muted: "#5C7E8C",
  line: "#DCEAEE",
  white: "#FFFFFF",
  accent: "#FCD462",
};

export const METRIC_HEX: Record<MetricKey, string> = {
  bp: "#B14A62",
  hr: "#C17A3B",
  ox: "#2C7A78",
  glu: "#6B5B95",
};

export const STATUS_HEX = {
  good: "#457A5C",
  watch: "#B0813A",
  urgent: "#B03D3D",
};

export const REFERENCE_TEXT: Record<MetricKey, string> = {
  bp: "Normal < 120 systolic; Elevated 120–129; Stage 1 130–139; Stage 2 140+ (mmHg)",
  hr: "Normal resting 60–100 bpm",
  ox: "Normal 95–100%; below 95% considered borderline",
  glu: "Normal fasting 70–99 mg/dL; 100–125 prediabetes range; 126+ diabetes range",
};

export type ReportRange = {
  period: Period;
  start: Date;
  end: Date;
  /** "Aug 18 – Aug 24, 2026" */
  label: string;
  /** "2026-08-18" */
  startKey: string;
  endKey: string;
  /** Every day key in the window, oldest first */
  dayKeys: string[];
};

function keyOf(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function buildRange(period: Period, now = new Date()): ReportRange {
  const days = PERIOD_DAYS[period];
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayKeys.push(keyOf(d));
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  const label = `${fmt(start, !sameYear)} – ${fmt(end, true)}`;

  return {
    period,
    start,
    end,
    label,
    startKey: keyOf(start),
    endKey: keyOf(end),
    dayKeys,
  };
}

export function fileNameFor(range: ReportRange) {
  return `Igloo-Report-${range.label.replace(/\s/g, "").replace("–", "-").replace(/,/g, "")}.pdf`;
}

export function longDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function shortDate(dayKey: string) {
  return new Date(`${dayKey}T12:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function timeLabel(iso: string) {
  const h = Number(iso.slice(11, 13));
  const m = iso.slice(14, 16);
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

function inRange(iso: string, range: ReportRange) {
  const key = dayKeyOf(iso);
  return key >= range.startKey && key <= range.endKey;
}

export type MetricSection = {
  metric: MetricKey;
  label: string;
  unit: string;
  color: string;
  rows: { dayKey: string; date: string; time: string; value: string; status: string; statusColor: string }[];
  count: number;
  average: string;
  min: string;
  max: string;
  latest: string;
  latestAt: string;
  reference: string;
  target?: string;
  /** Chart points, oldest first */
  points: { label: string; value: number }[];
};

export type MedicationSummary = {
  names: string[];
  daysLogged: number;
  totalDays: number;
  rows: { date: string; time: string; name: string; dose: string }[];
  dayKeys: string[];
};

export type ReportData = {
  range: ReportRange;
  generatedAt: Date;
  sections: MetricSection[];
  medication: MedicationSummary;
};

function fmtNum(metric: MetricKey, n: number) {
  const digits = metric === "ox" ? 1 : 0;
  return n.toFixed(digits);
}

export function buildReportData(
  readings: Reading[],
  meds: MedLog[],
  range: ReportRange,
  generatedAt = new Date(),
): ReportData {
  const sections: MetricSection[] = [];

  for (const metric of METRIC_ORDER) {
    const list = readings
      .filter((r) => r.metric === metric && inRange(r.at, range))
      .sort((a, b) => a.at.localeCompare(b.at));
    if (list.length === 0) continue;

    const nums = list.map((r) => numericValue(metric, r.value));
    const meta = METRICS[metric];
    const target = METRIC_DETAIL[metric].target;
    const latest = list[list.length - 1]!;

    sections.push({
      metric,
      label: meta.label,
      unit: meta.unit,
      color: METRIC_HEX[metric],
      count: list.length,
      average: fmtNum(metric, nums.reduce((a, b) => a + b, 0) / nums.length),
      min: fmtNum(metric, Math.min(...nums)),
      max: fmtNum(metric, Math.max(...nums)),
      latest: latest.value,
      latestAt: `${shortDate(dayKeyOf(latest.at))}, ${timeLabel(latest.at)}`,
      reference: REFERENCE_TEXT[metric],
      target: target ? `${target.from}–${target.to} ${meta.unit}` : undefined,
      rows: list.map((r) => ({
        dayKey: dayKeyOf(r.at),
        date: shortDate(dayKeyOf(r.at)),
        time: timeLabel(r.at),
        value: `${r.value} ${meta.unit}`,
        status: STATUS_META[r.status].label,
        statusColor: STATUS_HEX[r.status],
      })),
      points: list.map((r, i) => ({
        label: i === 0 || i === list.length - 1 ? shortDate(dayKeyOf(r.at)) : shortDate(dayKeyOf(r.at)),
        value: numericValue(metric, r.value),
      })),
    });
  }

  const medList = meds.filter((m) => inRange(m.at, range)).sort((a, b) => a.at.localeCompare(b.at));
  const medDayKeys = Array.from(new Set(medList.map((m) => dayKeyOf(m.at))));

  return {
    range,
    generatedAt,
    sections,
    medication: {
      names: Array.from(new Set(medList.map((m) => m.name))).sort(),
      daysLogged: medDayKeys.length,
      totalDays: range.dayKeys.length,
      dayKeys: medDayKeys,
      rows: medList.map((m) => ({
        date: shortDate(dayKeyOf(m.at)),
        time: timeLabel(m.at),
        name: m.name,
        dose: m.dose,
      })),
    },
  };
}
