import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  INITIAL_MEDS,
  INITIAL_READINGS,
  METRIC_ORDER,
  type MedLog,
  type MetricKey,
  type Reading,
  type Status,
} from "./igloo-data";

type Store = {
  readings: Reading[];
  addReading: (r: Omit<Reading, "id">) => void;
  meds: MedLog[];
  addMed: (m: Omit<MedLog, "id">) => void;
  simpleView: boolean;
  setSimpleView: (v: boolean) => void;
  shared: Record<MetricKey, boolean>;
  toggleShared: (m: MetricKey) => void;
  alertDismissed: boolean;
  dismissAlert: () => void;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  /** Pre-filled slot for the add sheet: day key + hour, or null for "now". */
  addSlot: { dayKey: string; hour: number } | null;
  openAdd: (slot?: { dayKey: string; hour: number }) => void;
};

const IglooContext = createContext<Store | null>(null);

export function IglooProvider({ children }: { children: ReactNode }) {
  const [readings, setReadings] = useState<Reading[]>(INITIAL_READINGS);
  const [meds, setMeds] = useState<MedLog[]>(INITIAL_MEDS);
  const [simpleView, setSimpleView] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [shared, setShared] = useState<Record<MetricKey, boolean>>({
    bp: true,
    hr: true,
    ox: false,
    glu: true,
  });

  const value = useMemo<Store>(
    () => ({
      readings,
      addReading: (r) => setReadings((prev) => [{ ...r, id: `r-${Date.now()}` }, ...prev]),
      meds,
      addMed: (m) => setMeds((prev) => [{ ...m, id: `m-${Date.now()}` }, ...prev]),
      simpleView,
      setSimpleView,
      shared,
      toggleShared: (m) => setShared((prev) => ({ ...prev, [m]: !prev[m] })),
      alertDismissed,
      dismissAlert: () => setAlertDismissed(true),
      addOpen,
      setAddOpen,
    }),
    [readings, meds, simpleView, shared, alertDismissed, addOpen],
  );

  return <IglooContext.Provider value={value}>{children}</IglooContext.Provider>;
}

export function useIgloo() {
  const ctx = useContext(IglooContext);
  if (!ctx) throw new Error("useIgloo must be used inside IglooProvider");
  return ctx;
}

/** Latest reading per metric, derived from the log. */
export function useLatest() {
  const { readings } = useIgloo();
  return useMemo(() => {
    const out = {} as Record<MetricKey, Reading | undefined>;
    for (const m of METRIC_ORDER) out[m] = readings.find((r) => r.metric === m);
    return out;
  }, [readings]);
}

export function worstStatus(list: (Status | undefined)[]): Status {
  if (list.includes("urgent")) return "urgent";
  if (list.includes("watch")) return "watch";
  return "good";
}
