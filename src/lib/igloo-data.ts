export type MetricKey = "bp" | "hr" | "ox" | "glu";
export type Status = "good" | "watch" | "urgent";
export type Method = "Scanned" | "Manual" | "Auto-synced";
export type MedMethod = "Logged" | "Scanned";

export type Category = "measurement" | "medication";

export type LogEntry =
  { type: "measurement"; data: Reading } | { type: "medication"; data: MedLog };

export type Reading = {
  id: string;
  metric: MetricKey;
  value: string;
  status: Status;
  method: Method;
  /** Local ISO timestamp: YYYY-MM-DDTHH:mm */
  at: string;
};

export type MedLog = {
  id: string;
  name: string;
  dose: string;
  method: MedMethod;
  /** Local ISO timestamp: YYYY-MM-DDTHH:mm */
  at: string;
  /** True when a photo of the pill/bottle was captured */
  photo?: boolean;
};

// ---------- date helpers (local time) ----------

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO timestamp for `days` ago at h:min local time. */
export function isoDaysAgo(days: number, h: number, min: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, min, 0, 0);
  return localISO(d);
}

/** YYYY-MM-DD key for grouping by calendar day. */
export function dayKeyOf(iso: string) {
  return iso.slice(0, 10);
}

export function todayKey() {
  return localISO(new Date()).slice(0, 10);
}

/** "7:40 AM" from an ISO timestamp. */
export function timeOf(iso: string) {
  const h = Number(iso.slice(11, 13));
  const m = iso.slice(14, 16);
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** "Today" / "Yesterday" / "Wed, Aug 19" for a YYYY-MM-DD key. */
export function dayLabel(key: string) {
  if (key === todayKey()) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === localISO(y).slice(0, 10)) return "Yesterday";
  return new Date(`${key}T12:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Today · 7:40 AM" style label for a timestamp. */
export function formatAt(iso: string) {
  return `${dayLabel(dayKeyOf(iso))} · ${timeOf(iso)}`;
}

export function fullDateToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ---------- metrics ----------

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

// ---------- mock log: past two weeks ----------

export const INITIAL_READINGS: Reading[] = [
  // today
  {
    id: "r1",
    metric: "bp",
    value: "132/86",
    status: "watch",
    method: "Scanned",
    at: isoDaysAgo(0, 7, 40),
  },
  {
    id: "r2",
    metric: "hr",
    value: "78",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(0, 7, 38),
  },
  {
    id: "r3",
    metric: "ox",
    value: "97",
    status: "good",
    method: "Manual",
    at: isoDaysAgo(0, 7, 35),
  },
  {
    id: "r4",
    metric: "glu",
    value: "104",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(0, 6, 55),
  },
  // yesterday
  {
    id: "r5",
    metric: "bp",
    value: "126/80",
    status: "good",
    method: "Manual",
    at: isoDaysAgo(1, 20, 10),
  },
  {
    id: "r6",
    metric: "hr",
    value: "76",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(1, 20, 5),
  },
  {
    id: "r7",
    metric: "glu",
    value: "148",
    status: "urgent",
    method: "Scanned",
    at: isoDaysAgo(1, 13, 20),
  },
  {
    id: "r8",
    metric: "ox",
    value: "95",
    status: "watch",
    method: "Manual",
    at: isoDaysAgo(1, 7, 30),
  },
  // day 2
  {
    id: "r9",
    metric: "bp",
    value: "128/82",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(2, 7, 45),
  },
  {
    id: "r10",
    metric: "hr",
    value: "73",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(2, 7, 44),
  },
  {
    id: "r11",
    metric: "glu",
    value: "112",
    status: "good",
    method: "Manual",
    at: isoDaysAgo(2, 12, 40),
  },
  // day 3
  {
    id: "r12",
    metric: "bp",
    value: "135/88",
    status: "watch",
    method: "Scanned",
    at: isoDaysAgo(3, 8, 5),
  },
  {
    id: "r13",
    metric: "ox",
    value: "96",
    status: "good",
    method: "Manual",
    at: isoDaysAgo(3, 8, 2),
  },
  // day 4 — rest day, nothing logged
  // day 5
  {
    id: "r14",
    metric: "bp",
    value: "124/79",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(5, 7, 50),
  },
  {
    id: "r15",
    metric: "hr",
    value: "71",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(5, 7, 48),
  },
  {
    id: "r16",
    metric: "glu",
    value: "118",
    status: "watch",
    method: "Scanned",
    at: isoDaysAgo(5, 17, 25),
  },
  // day 6
  {
    id: "r17",
    metric: "bp",
    value: "130/84",
    status: "watch",
    method: "Manual",
    at: isoDaysAgo(6, 8, 15),
  },
  {
    id: "r18",
    metric: "ox",
    value: "97",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(6, 8, 12),
  },
  // day 7
  {
    id: "r19",
    metric: "bp",
    value: "127/81",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(7, 7, 55),
  },
  {
    id: "r20",
    metric: "hr",
    value: "74",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(7, 7, 52),
  },
  {
    id: "r21",
    metric: "glu",
    value: "109",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(7, 13, 5),
  },
  // day 9
  {
    id: "r22",
    metric: "bp",
    value: "138/89",
    status: "watch",
    method: "Scanned",
    at: isoDaysAgo(9, 8, 20),
  },
  {
    id: "r23",
    metric: "ox",
    value: "94",
    status: "watch",
    method: "Manual",
    at: isoDaysAgo(9, 8, 17),
  },
  // day 10
  {
    id: "r24",
    metric: "bp",
    value: "125/78",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(10, 7, 35),
  },
  {
    id: "r25",
    metric: "hr",
    value: "72",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(10, 7, 33),
  },
  {
    id: "r26",
    metric: "glu",
    value: "121",
    status: "watch",
    method: "Manual",
    at: isoDaysAgo(10, 19, 10),
  },
  // day 12
  {
    id: "r27",
    metric: "bp",
    value: "129/83",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(12, 8, 0),
  },
  {
    id: "r28",
    metric: "glu",
    value: "107",
    status: "good",
    method: "Scanned",
    at: isoDaysAgo(12, 7, 58),
  },
  // day 13
  {
    id: "r29",
    metric: "bp",
    value: "133/85",
    status: "watch",
    method: "Manual",
    at: isoDaysAgo(13, 8, 10),
  },
  {
    id: "r30",
    metric: "hr",
    value: "77",
    status: "good",
    method: "Auto-synced",
    at: isoDaysAgo(13, 8, 8),
  },
];

export const SAVED_MEDS: { name: string; dose: string }[] = [
  { name: "Metformin", dose: "500mg" },
  { name: "Vitamin D", dose: "1000 IU" },
  { name: "Lisinopril", dose: "10mg" },
  { name: "Omega-3", dose: "1 capsule" },
];

export const INITIAL_MEDS: MedLog[] = [
  // today
  { id: "m1", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(0, 8, 2) },
  {
    id: "m2",
    name: "Vitamin D",
    dose: "1000 IU",
    method: "Scanned",
    at: isoDaysAgo(0, 8, 3),
    photo: true,
  },
  // yesterday
  { id: "m3", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(1, 8, 1) },
  { id: "m4", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(1, 18, 15) },
  { id: "m5", name: "Vitamin D", dose: "1000 IU", method: "Logged", at: isoDaysAgo(1, 8, 4) },
  // day 2
  {
    id: "m6",
    name: "Metformin",
    dose: "500mg",
    method: "Scanned",
    at: isoDaysAgo(2, 8, 5),
    photo: true,
  },
  { id: "m7", name: "Lisinopril", dose: "10mg", method: "Logged", at: isoDaysAgo(2, 9, 0) },
  // day 3 — missed
  // day 4
  { id: "m8", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(4, 8, 10) },
  { id: "m9", name: "Omega-3", dose: "1 capsule", method: "Logged", at: isoDaysAgo(4, 8, 12) },
  // day 5
  { id: "m10", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(5, 7, 58) },
  {
    id: "m11",
    name: "Vitamin D",
    dose: "1000 IU",
    method: "Scanned",
    at: isoDaysAgo(5, 8, 0),
    photo: true,
  },
  // day 6
  { id: "m12", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(6, 8, 20) },
  { id: "m13", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(6, 18, 30) },
  // day 7
  {
    id: "m14",
    name: "Metformin",
    dose: "500mg",
    method: "Scanned",
    at: isoDaysAgo(7, 8, 0),
    photo: true,
  },
  { id: "m15", name: "Lisinopril", dose: "10mg", method: "Logged", at: isoDaysAgo(7, 9, 5) },
  // day 9
  { id: "m16", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(9, 8, 25) },
  // day 10
  { id: "m17", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(10, 7, 40) },
  { id: "m18", name: "Omega-3", dose: "1 capsule", method: "Logged", at: isoDaysAgo(10, 7, 42) },
  // day 12
  { id: "m19", name: "Metformin", dose: "500mg", method: "Logged", at: isoDaysAgo(12, 8, 5) },
  { id: "m20", name: "Vitamin D", dose: "1000 IU", method: "Logged", at: isoDaysAgo(12, 8, 7) },
  // day 13
  {
    id: "m21",
    name: "Metformin",
    dose: "500mg",
    method: "Scanned",
    at: isoDaysAgo(13, 8, 15),
    photo: true,
  },
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
