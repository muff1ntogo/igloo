export type MetricKey = "bp" | "hr" | "ox" | "glu";
export type Status = "good" | "watch" | "urgent";
export type Method = "Scanned" | "Manual" | "Auto-synced";

export type Reading = {
  id: string;
  metric: MetricKey;
  value: string;
  status: Status;
  method: Method;
  /** ISO-ish timestamp string */
  at: string;
};

export const METRICS: Record<
  MetricKey,
  {
    key: MetricKey;
    label: string;
    unit: string;
    color: string;
    tint: string;
    text: string;
    placeholder: string;
  }
> = {
  bp: {
    key: "bp",
    label: "Blood Pressure",
    unit: "mmHg",
    color: "bg-bp",
    tint: "bg-bp-tint",
    text: "text-bp",
    placeholder: "128/82",
  },
  hr: {
    key: "hr",
    label: "Heart Rate",
    unit: "bpm",
    color: "bg-hr",
    tint: "bg-hr-tint",
    text: "text-hr",
    placeholder: "74",
  },
  ox: {
    key: "ox",
    label: "Oxygen",
    unit: "%",
    color: "bg-ox",
    tint: "bg-ox-tint",
    text: "text-ox",
    placeholder: "97",
  },
  glu: {
    key: "glu",
    label: "Glucose",
    unit: "mg/dL",
    color: "bg-glu",
    tint: "bg-glu-tint",
    text: "text-glu",
    placeholder: "104",
  },
};

export const METRIC_ORDER: MetricKey[] = ["bp", "hr", "ox", "glu"];

export const STATUS_META: Record<
  Status,
  { label: string; badge: string; dot: string; text: string }
> = {
  good: {
    label: "Good",
    badge: "bg-good-tint text-good",
    dot: "bg-good",
    text: "text-good",
  },
  watch: {
    label: "Watch",
    badge: "bg-watch-tint text-watch",
    dot: "bg-watch",
    text: "text-watch",
  },
  urgent: {
    label: "Urgent",
    badge: "bg-urgent-tint text-urgent",
    dot: "bg-urgent",
    text: "text-urgent",
  },
};

export const DELTAS: Record<MetricKey, string> = {
  bp: "-4 vs yesterday",
  hr: "+3 vs yesterday",
  ox: "+1 vs yesterday",
  glu: "-9 vs yesterday",
};

export const TRENDS: Record<MetricKey, number[]> = {
  bp: [134, 131, 129, 133, 128, 126, 132],
  hr: [70, 72, 71, 75, 73, 76, 78],
  ox: [96, 97, 97, 96, 98, 97, 97],
  glu: [118, 112, 121, 109, 114, 106, 104],
};

export const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
/** Readings logged per day this week, target 3 */
export const WEEK_LOGGED = [3, 3, 2, 3, 3, 1, 2];

export const INITIAL_READINGS: Reading[] = [
  { id: "r1", metric: "bp", value: "132/86", status: "watch", method: "Scanned", at: "Today · 7:40 AM" },
  { id: "r2", metric: "hr", value: "78", status: "good", method: "Auto-synced", at: "Today · 7:38 AM" },
  { id: "r3", metric: "ox", value: "97", status: "good", method: "Manual", at: "Today · 7:35 AM" },
  { id: "r4", metric: "glu", value: "104", status: "good", method: "Scanned", at: "Today · 6:55 AM" },
  { id: "r5", metric: "bp", value: "126/80", status: "good", method: "Manual", at: "Yesterday · 8:10 PM" },
  { id: "r6", metric: "hr", value: "76", status: "good", method: "Auto-synced", at: "Yesterday · 8:05 PM" },
  { id: "r7", metric: "glu", value: "148", status: "urgent", method: "Scanned", at: "Yesterday · 1:20 PM" },
  { id: "r8", metric: "ox", value: "95", status: "watch", method: "Manual", at: "Yesterday · 7:30 AM" },
  { id: "r9", metric: "bp", value: "128/82", status: "good", method: "Scanned", at: "Wed, Aug 19 · 7:45 AM" },
  { id: "r10", metric: "hr", value: "73", status: "good", method: "Auto-synced", at: "Wed, Aug 19 · 7:44 AM" },
];

export const LATEST: Record<MetricKey, { value: string; status: Status }> = {
  bp: { value: "132/86", status: "watch" },
  hr: { value: "78", status: "good" },
  ox: { value: "97", status: "good" },
  glu: { value: "104", status: "good" },
};

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  initials: string;
  status: Status;
  note: string;
};

export const FAMILY: FamilyMember[] = [
  {
    id: "f1",
    name: "Maya Whitfield",
    relation: "Daughter",
    initials: "MW",
    status: "good",
    note: "Checked in this morning. All looks steady.",
  },
  {
    id: "f2",
    name: "Daniel Whitfield",
    relation: "Son",
    initials: "DW",
    status: "watch",
    note: "Asked about the blood pressure reading from Tuesday.",
  },
  {
    id: "f3",
    name: "Dr. Alina Rao",
    relation: "Family doctor",
    initials: "AR",
    status: "good",
    note: "Next check-up on the 3rd. Bring the glucose log.",
  },
];
