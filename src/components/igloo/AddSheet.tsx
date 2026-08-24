import { useEffect, useState } from "react";
import { Camera, Check, ChevronLeft, Keyboard, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { METRICS, METRIC_ORDER, type MetricKey, type Status } from "@/lib/igloo-data";
import { useIgloo } from "@/lib/igloo-store";
import { cn } from "@/lib/utils";
import { MetricIcon, PulseLine } from "./ui";

type Step = "choose" | "scan" | "confirm" | "manual";

function nowLabel() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `Today · ${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
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
  const { addOpen, setAddOpen, addReading } = useIgloo();
  const [step, setStep] = useState<Step>("choose");
  const [metric, setMetric] = useState<MetricKey>("bp");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (addOpen) {
      setStep("choose");
      setMetric("bp");
      setValue("");
    }
  }, [addOpen]);

  // Mock scan: after a beat, "extract" a value for confirmation.
  useEffect(() => {
    if (step !== "scan") return;
    const t = setTimeout(() => {
      setValue(METRICS[metric].placeholder);
      setStep("confirm");
    }, 1800);
    return () => clearTimeout(t);
  }, [step, metric]);

  const save = (method: "Scanned" | "Manual") => {
    const v = value.trim();
    if (!v) {
      toast.error("Please enter a reading first.");
      return;
    }
    addReading({ metric, value: v, method, status: statusFor(metric, v), at: nowLabel() });
    setAddOpen(false);
    toast.success(`${METRICS[metric].label} saved to your log.`);
  };

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
            <DrawerTitle className="text-xl font-bold text-foreground">
              {step === "choose"
                ? "Add a reading"
                : step === "manual"
                  ? "Enter manually"
                  : step === "scan"
                    ? "Scan a reading"
                    : "Check the reading"}
            </DrawerTitle>
          </div>
          <PulseLine className="mt-3 h-3.5 w-24" />
        </div>

        {step === "choose" ? (
          <div className="space-y-3 pb-2">
            <BigChoice
              icon={<ScanLine className="size-6 text-primary" />}
              title="Scan a reading"
              body="Point your camera at the display on your monitor."
              onClick={() => setStep("scan")}
            />
            <BigChoice
              icon={<Keyboard className="size-6 text-primary" />}
              title="Enter manually"
              body="Type the numbers yourself. Takes a few seconds."
              onClick={() => setStep("manual")}
            />
          </div>
        ) : null}

        {step === "scan" ? (
          <div className="pb-2">
            <MetricPicker value={metric} onChange={setMetric} />
            <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-[22px] border border-border bg-foreground/90">
              <div className="relative flex size-full items-center justify-center">
                <div className="absolute inset-8 rounded-2xl border-2 border-primary-tint/70" />
                <div className="absolute inset-x-8 h-0.5 animate-pulse bg-primary-tint" />
                <div className="relative flex flex-col items-center gap-2 text-primary-tint">
                  <Camera className="size-8" />
                  <p className="text-sm font-semibold">Reading the display…</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Hold steady. We&apos;ll show you the numbers before saving.
            </p>
          </div>
        ) : null}

        {step === "confirm" ? (
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
            <label className="mt-5 block text-sm font-semibold text-foreground">
              Not quite right? Edit it here
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="text"
                className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 font-serif text-2xl text-foreground outline-none focus:border-primary"
              />
            </label>
            <PrimaryButton onClick={() => save("Scanned")}>
              <Check className="size-5" /> Looks right, save it
            </PrimaryButton>
          </div>
        ) : null}

        {step === "manual" ? (
          <div className="pb-2">
            <MetricPicker value={metric} onChange={setMetric} />
            <label className="mt-5 block text-sm font-semibold text-foreground">
              {METRICS[metric].label} ({METRICS[metric].unit})
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={METRICS[metric].placeholder}
                inputMode={metric === "bp" ? "text" : "decimal"}
                className="mt-2 h-16 w-full rounded-2xl border border-input bg-background px-4 font-serif text-3xl text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
              />
            </label>
            <PrimaryButton onClick={() => save("Manual")}>
              <Check className="size-5" /> Save reading
            </PrimaryButton>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
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
