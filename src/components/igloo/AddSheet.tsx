import { useEffect, useState } from "react";
import { Camera, Check, ChevronLeft, Keyboard, Pill, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  localISO,
  METRICS,
  METRIC_ORDER,
  SAVED_MEDS,
  todayKey,
  type MetricKey,
  type Status,
} from "@/lib/igloo-data";
import { useIgloo } from "@/lib/igloo-store";
import { cn } from "@/lib/utils";
import { MetricIcon, PulseLine } from "./ui";

type Step = "choose" | "scan" | "confirm" | "manual";
type Category = "medication" | "measurement";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function statusFor(metric: MetricKey, value: string): Status {
  const n = Number(value.split("/")[0]);
  if (Number.isNaN(n)) return "good";
  if (metric === "bp") return n >= 140 ? "urgent" : n >= 130 ? "watch" : "good";
  if (metric === "hr") return n >= 110 || n < 45 ? "urgent" : n >= 95 ? "watch" : "good";
  if (metric === "ox") return n < 92 ? "urgent" : n < 96 ? "watch" : "good";
  return n >= 180 ? "urgent" : n >= 140 ? "watch" : "good";
}

export function AddSheet() {
  const { addOpen, setAddOpen, addReading, addMed, addSlot } = useIgloo();
  const [cat, setCat] = useState<Category>("measurement");
  const [step, setStep] = useState<Step>("choose");
  const [metric, setMetric] = useState<MetricKey>("bp");
  const [value, setValue] = useState("");
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [dayKey, setDayKey] = useState(todayKey());
  const [time, setTime] = useState("08:00");
  const [photo, setPhoto] = useState(false);

  useEffect(() => {
    if (!addOpen) return;
    setCat("measurement");
    setStep("choose");
    setMetric("bp");
    setValue("");
    setMedName("");
    setMedDose("");
    setPhoto(false);
    if (addSlot) {
      setDayKey(addSlot.dayKey);
      setTime(`${pad(addSlot.hour)}:00`);
    } else {
      const now = new Date();
      setDayKey(todayKey());
      setTime(localISO(now).slice(11, 16));
    }
  }, [addOpen, addSlot]);

  // Mock scan: after a beat, "extract" something to confirm.
  useEffect(() => {
    if (step !== "scan") return;
    const t = setTimeout(() => {
      if (cat === "measurement") {
        setValue(METRICS[metric].placeholder);
      } else {
        setPhoto(true);
        const guess = SAVED_MEDS[0]!;
        setMedName((n) => n || guess.name);
        setMedDose((d) => d || guess.dose);
      }
      setStep("confirm");
    }, 1800);
    return () => clearTimeout(t);
  }, [step, metric, cat]);

  const at = `${dayKey}T${time}`;

  const saveMeasurement = (method: "Scanned" | "Manual") => {
    const v = value.trim();
    if (!v) {
      toast.error("Please enter a reading first.");
      return;
    }
    addReading({ metric, value: v, method, status: statusFor(metric, v), at });
    setAddOpen(false);
    toast.success(`${METRICS[metric].label} saved to your log.`);
  };

  const saveMed = (method: "Logged" | "Scanned") => {
    const n = medName.trim();
    if (!n) {
      toast.error("Please add the medication name.");
      return;
    }
    addMed({ name: n, dose: medDose.trim() || "1 dose", method, at, photo });
    setAddOpen(false);
    toast.success(`${n} saved to your log.`);
  };

  const title =
    step === "choose"
      ? cat === "medication"
        ? "Log a medication"
        : "Add a reading"
      : step === "manual"
        ? "Enter manually"
        : step === "scan"
          ? cat === "medication"
            ? "Take a photo"
            : "Scan a reading"
          : cat === "medication"
            ? "Check the details"
            : "Check the reading";

  return (
    <Drawer open={addOpen} onOpenChange={setAddOpen}>
      <DrawerContent className="mx-auto max-w-md rounded-t-[28px] border-border bg-card px-5 pb-8">
        <div className="pt-2 pb-4">
          <div className="flex items-center gap-2">
            {step !== "choose" ? (
              <button
                type="button"
                onClick={() => setStep(step === "confirm" ? "scan" : "choose")}
                aria-label="Back"
                className="-ml-2 flex size-11 items-center justify-center rounded-full text-muted-foreground"
              >
                <ChevronLeft className="size-6" />
              </button>
            ) : null}
            <DrawerTitle className="text-xl font-bold text-foreground">{title}</DrawerTitle>
          </div>
          <PulseLine className="mt-3 h-3.5 w-24" />
        </div>

        {step === "choose" ? (
          <div className="space-y-4 pb-2">
            <div className="flex rounded-full border border-border bg-background p-1">
              {(["medication", "measurement"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-full text-sm font-bold capitalize transition-colors",
                    cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <BigChoice
                icon={
                  cat === "medication" ? (
                    <Camera className="size-6 text-primary" />
                  ) : (
                    <ScanLine className="size-6 text-primary" />
                  )
                }
                title={cat === "medication" ? "Take a photo" : "Scan a reading"}
                body={
                  cat === "medication"
                    ? "Snap the pill or bottle, then confirm the details."
                    : "Point your camera at the display on your monitor."
                }
                onClick={() => setStep("scan")}
              />
              <BigChoice
                icon={
                  cat === "medication" ? (
                    <Pill className="size-6 text-primary" />
                  ) : (
                    <Keyboard className="size-6 text-primary" />
                  )
                }
                title={cat === "medication" ? "Log it myself" : "Enter manually"}
                body={
                  cat === "medication"
                    ? "Pick from your medications or type a new one."
                    : "Type the numbers yourself. Takes a few seconds."
                }
                onClick={() => setStep("manual")}
              />
            </div>
          </div>
        ) : null}

        {step === "scan" ? (
          <div className="pb-2">
            {cat === "measurement" ? <MetricPicker value={metric} onChange={setMetric} /> : null}
            <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-[22px] border border-border bg-foreground/90">
              <div className="relative flex size-full items-center justify-center">
                <div className="absolute inset-8 rounded-2xl border-2 border-primary-tint/70" />
                <div className="absolute inset-x-8 h-0.5 animate-pulse bg-primary-tint" />
                <div className="relative flex flex-col items-center gap-2 text-primary-tint">
                  <Camera className="size-8" />
                  <p className="text-sm font-semibold">
                    {cat === "medication" ? "Capturing the label…" : "Reading the display…"}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Hold steady. We&apos;ll show you the details before saving.
            </p>
          </div>
        ) : null}

        {step === "confirm" && cat === "measurement" ? (
          <div className="pb-2">
            <div className="flex items-center gap-4 rounded-[22px] border border-border bg-background p-4">
              <MetricIcon metric={metric} size="lg" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {METRICS[metric].label}
                </p>
                <p className="font-serif text-3xl leading-tight text-foreground">
                  {value}
                  <span className="ml-1.5 font-sans text-xs font-semibold text-muted-foreground">
                    {METRICS[metric].unit}
                  </span>
                </p>
              </div>
            </div>
            <Field label="Not quite right? Edit it here">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="text"
                className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 font-serif text-2xl text-foreground outline-none focus:border-primary"
              />
            </Field>
            <TimeField value={time} onChange={setTime} />
            <PrimaryButton onClick={() => saveMeasurement("Scanned")}>
              <Check className="size-5" /> Looks right, save it
            </PrimaryButton>
          </div>
        ) : null}

        {step === "confirm" && cat === "medication" ? (
          <div className="pb-2">
            <div className="flex items-center gap-3 rounded-[22px] border border-border bg-primary-tint p-4">
              <Camera className="size-5 text-primary" />
              <p className="text-sm font-semibold text-primary">Photo captured</p>
            </div>
            <MedFields
              name={medName}
              dose={medDose}
              onName={setMedName}
              onDose={setMedDose}
              time={time}
              onTime={setTime}
            />
            <PrimaryButton onClick={() => saveMed("Scanned")}>
              <Check className="size-5" /> Looks right, save it
            </PrimaryButton>
          </div>
        ) : null}

        {step === "manual" && cat === "measurement" ? (
          <div className="pb-2">
            <MetricPicker value={metric} onChange={setMetric} />
            <Field label={`${METRICS[metric].label} (${METRICS[metric].unit})`}>
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={METRICS[metric].placeholder}
                inputMode={metric === "bp" ? "text" : "decimal"}
                className="mt-2 h-16 w-full rounded-2xl border border-input bg-background px-4 font-serif text-3xl text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
              />
            </Field>
            <TimeField value={time} onChange={setTime} />
            <PrimaryButton onClick={() => saveMeasurement("Manual")}>
              <Check className="size-5" /> Save reading
            </PrimaryButton>
          </div>
        ) : null}

        {step === "manual" && cat === "medication" ? (
          <div className="pb-2">
            <div className="flex flex-wrap gap-2">
              {SAVED_MEDS.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setMedName(m.name);
                    setMedDose(m.dose);
                  }}
                  className={cn(
                    "min-h-[44px] rounded-full border px-4 text-sm font-bold transition-colors",
                    medName === m.name
                      ? "border-primary bg-primary-tint text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <MedFields
              name={medName}
              dose={medDose}
              onName={setMedName}
              onDose={setMedDose}
              time={time}
              onTime={setTime}
            />
            <PrimaryButton onClick={() => saveMed("Logged")}>
              <Check className="size-5" /> Save medication
            </PrimaryButton>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-5 block text-sm font-semibold text-foreground">
      {label}
      {children}
    </label>
  );
}

function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Time">
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 text-lg font-semibold text-foreground outline-none focus:border-primary"
      />
    </Field>
  );
}

function MedFields({
  name,
  dose,
  onName,
  onDose,
  time,
  onTime,
}: {
  name: string;
  dose: string;
  onName: (v: string) => void;
  onDose: (v: string) => void;
  time: string;
  onTime: (v: string) => void;
}) {
  return (
    <>
      <Field label="Medication name">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Metformin"
          className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
        />
      </Field>
      <Field label="Dose">
        <input
          value={dose}
          onChange={(e) => onDose(e.target.value)}
          placeholder="500mg"
          className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
        />
      </Field>
      <TimeField value={time} onChange={onTime} />
    </>
  );
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function BigChoice({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-[22px] border border-border bg-background p-4 text-left transition-colors active:bg-primary-tint"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-tint">
        {icon}
      </span>
      <span>
        <span className="block text-base font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
      </span>
    </button>
  );
}

function MetricPicker({ value, onChange }: { value: MetricKey; onChange: (m: MetricKey) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {METRIC_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "flex min-h-[64px] items-center gap-3 rounded-2xl border bg-background px-3 text-left",
            value === m ? "border-primary bg-primary-tint" : "border-border",
          )}
        >
          <MetricIcon metric={m} />
          <span className="text-sm font-bold text-foreground">{METRICS[m].label}</span>
        </button>
      ))}
    </div>
  );
}
