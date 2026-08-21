import { METRICS, type MetricKey, type Status } from "./igloo-data";

export type Zone = { name: string; from: number; to: number; status: Status };

export type MetricDetail = {
  /** Gauge domain */
  min: number;
  max: number;
  zones: Zone[];
  /** Personal target range set in Profile, if any */
  target?: { from: number; to: number };
  /** For blood pressure the gauge/chart tracks the systolic value */
  readsAs?: string;
  about: string;
  tips: string[];
};

export const METRIC_DETAIL: Record<MetricKey, MetricDetail> = {
  bp: {
    min: 90,
    max: 180,
    readsAs: "Systolic (the upper number)",
    zones: [
      { name: "Normal", from: 90, to: 120, status: "good" },
      { name: "Elevated", from: 120, to: 130, status: "watch" },
      { name: "Stage 1", from: 130, to: 140, status: "watch" },
      { name: "Stage 2", from: 140, to: 180, status: "urgent" },
    ],
    target: { from: 110, to: 130 },
    about:
      "Blood pressure measures the force of blood pushing against the walls of your arteries. It is written as two numbers: systolic, the pressure while the heart beats, over diastolic, the pressure while it rests between beats. Readings move throughout the day with activity, posture, caffeine and stress.",
    tips: [
      "Sit quietly for a few minutes before measuring, with feet flat and arm supported at heart height.",
      "Regular gentle movement — walking, gardening, swimming — is commonly associated with steadier readings.",
      "Many people watch how much salt is in packaged and restaurant food.",
      "Sleep and unhurried days tend to show up in these numbers too.",
    ],
  },
  hr: {
    min: 40,
    max: 140,
    zones: [
      { name: "Low", from: 40, to: 60, status: "watch" },
      { name: "Normal resting", from: 60, to: 100, status: "good" },
      { name: "Elevated", from: 100, to: 120, status: "watch" },
      { name: "High", from: 120, to: 140, status: "urgent" },
    ],
    target: { from: 60, to: 85 },
    about:
      "Heart rate is the number of times your heart beats in one minute. A resting heart rate is taken when you have been still and calm for several minutes. It naturally rises with movement, warmth, caffeine and emotion, and settles again with rest.",
    tips: [
      "Take the reading after sitting still for a while, not straight after moving about.",
      "Staying hydrated through the day is often reflected in a calmer resting rate.",
      "Slow breathing, a short rest or quiet music can help the number settle.",
      "Regular, comfortable activity tends to lower resting heart rate over months.",
    ],
  },
  ox: {
    min: 85,
    max: 100,
    zones: [
      { name: "Low", from: 85, to: 90, status: "urgent" },
      { name: "Borderline", from: 90, to: 95, status: "watch" },
      { name: "Normal", from: 95, to: 100, status: "good" },
    ],
    target: { from: 95, to: 100 },
    about:
      "Blood oxygen saturation is the percentage of your red blood cells carrying oxygen. A fingertip pulse oximeter estimates it with light passed through the skin. Cold hands, nail polish and movement can all make a reading look lower than it is.",
    tips: [
      "Warm your hands and keep them still for a truer reading.",
      "Sitting upright rather than slouched gives the lungs more room.",
      "Gentle breathing exercises are a common part of daily routines.",
      "Fresh air and light activity suit most people better than long stretches of sitting.",
    ],
  },
  glu: {
    min: 50,
    max: 200,
    zones: [
      { name: "Low", from: 50, to: 70, status: "urgent" },
      { name: "Normal fasting", from: 70, to: 100, status: "good" },
      { name: "Prediabetes range", from: 100, to: 126, status: "watch" },
      { name: "Diabetes range", from: 126, to: 200, status: "urgent" },
    ],
    target: { from: 80, to: 115 },
    about:
      "Blood glucose is the amount of sugar circulating in your blood, the body's main source of energy. Fasting readings are taken before eating; readings after a meal are naturally higher. Illness, sleep and stress can all shift the number.",
    tips: [
      "Note whether a reading was before or after a meal — the two aren't comparable.",
      "Meals with fibre, protein and vegetables tend to make for gentler changes.",
      "A short walk after eating is a habit many people find helpful.",
      "Rest and steady routines matter here as much as food does.",
    ],
  },
};

export const DOCTOR_NOTE =
  "None of this is a diagnosis. If something looks different from your usual pattern, it's worth mentioning at your next appointment.";

export const RANGES = ["1W", "1M", "3M", "6M", "1Y", "All"] as const;
export type RangeKey = (typeof RANGES)[number];

const POINTS: Record<RangeKey, number> = {
  "1W": 7,
  "1M": 15,
  "3M": 24,
  "6M": 30,
  "1Y": 36,
  All: 44,
};

export const RANGE_LABEL: Record<RangeKey, string> = {
  "1W": "last 7 days",
  "1M": "last month",
  "3M": "last 3 months",
  "6M": "last 6 months",
  "1Y": "last year",
  All: "all time",
};

/** Deterministic mock series so the chart is stable across renders. */
export function seriesFor(metric: MetricKey, range: RangeKey, current: number): number[] {
  const n = POINTS[range];
  const spread = (METRIC_DETAIL[metric].max - METRIC_DETAIL[metric].min) * 0.14;
  const seed = metric.charCodeAt(0) * 31 + range.charCodeAt(0);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((i + seed) * 1.7) * 0.6 + Math.sin((i + seed) * 0.53) * 0.4;
    const drift = ((i - n + 1) / n) * spread * 0.5;
    out.push(Math.round((current - drift + wobble * spread) * 10) / 10);
  }
  out[n - 1] = current;
  return out;
}

export function rollingAverage(data: number[], window = 5): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function average(data: number[]): number {
  if (!data.length) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

/** Blood pressure is stored as "132/86"; everything else is a plain number. */
export function numericValue(metric: MetricKey, value: string | undefined): number {
  if (!value) return 0;
  const first = value.split("/")[0] ?? value;
  const n = Number.parseFloat(first);
  return Number.isFinite(n) ? n : 0;
}

export function zoneFor(metric: MetricKey, value: number): Zone {
  const zones = METRIC_DETAIL[metric].zones;
  return (
    zones.find((z) => value >= z.from && value < z.to) ??
    (value < zones[0]!.from ? zones[0]! : zones[zones.length - 1]!)
  );
}

export function formatValue(metric: MetricKey, n: number): string {
  return metric === "ox" || metric === "bp" ? String(Math.round(n)) : String(Math.round(n));
}

export function unitOf(metric: MetricKey) {
  return METRICS[metric].unit;
}
