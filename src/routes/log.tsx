import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pill, Plus } from "lucide-react";
import {
  dayKeyOf,
  dayLabel,
  localISO,
  METRICS,
  STATUS_META,
  timeOf,
  todayKey,
  type MedLog,
  type Reading,
} from "@/lib/igloo-data";
import { useIgloo } from "@/lib/igloo-store";
import { METRIC_ICONS, PageHeader } from "@/components/igloo/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Your log — Igloo" },
      {
        name: "description",
        content: "Your day, hour by hour: readings and medications in one gentle timeline.",
      },
      { property: "og:title", content: "Your log — Igloo" },
      {
        property: "og:description",
        content: "Your day, hour by hour: readings and medications in one gentle timeline.",
      },
    ],
  }),
  component: LogPage,
});

const START_HOUR = 6;
const END_HOUR = 22;
const WEEKS_BACK = 12;

type Entry = { kind: "measurement"; item: Reading } | { kind: "medication"; item: MedLog };

function startOfWeek(d: Date) {
  const out = new Date(d);
  out.setHours(12, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

/** Weeks oldest → newest, current week last. Each week is 7 day keys (Sun→Sat). */
function buildWeeks() {
  const base = startOfWeek(new Date());
  const weeks: { key: string; letter: string; num: number }[][] = [];
  for (let w = WEEKS_BACK; w >= 0; w--) {
    const days: { key: string; letter: string; num: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - w * 7 + i);
      days.push({
        key: localISO(d).slice(0, 10),
        letter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        num: d.getDate(),
      });
    }
    weeks.push(days);
  }
  return weeks;
}

function LogPage() {
  const { readings, meds, openAdd } = useIgloo();
  const weeks = useMemo(buildWeeks, []);
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const stripRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const loggedDays = useMemo(() => {
    const s = new Set<string>();
    for (const r of readings) s.add(dayKeyOf(r.at));
    for (const m of meds) s.add(dayKeyOf(m.at));
    return s;
  }, [readings, meds]);

  const dayEntries = useMemo(() => {
    const list: Entry[] = [
      ...readings.filter((r) => dayKeyOf(r.at) === selected).map((r) => ({ kind: "measurement" as const, item: r })),
      ...meds.filter((m) => dayKeyOf(m.at) === selected).map((m) => ({ kind: "medication" as const, item: m })),
    ];
    return list.sort((a, b) => a.item.at.localeCompare(b.item.at));
  }, [readings, meds, selected]);

  const byHour = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of dayEntries) {
      const h = Math.min(Math.max(Number(e.item.at.slice(11, 13)), START_HOUR), END_HOUR);
      const arr = map.get(h) ?? [];
      arr.push(e);
      map.set(h, arr);
    }
    return map;
  }, [dayEntries]);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) out.push(h);
    return out;
  }, []);

  const nowHour = new Date().getHours();
  const isToday = selected === today;

  // Start on the current week.
  useEffect(() => {
    const el = stripRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // Auto-scroll the timeline to the current hour, or the last logged entry.
  useEffect(() => {
    const target = isToday
      ? Math.min(Math.max(nowHour, START_HOUR), END_HOUR)
      : dayEntries.length > 0
        ? Number(dayEntries[dayEntries.length - 1]!.item.at.slice(11, 13))
        : START_HOUR;
    const node = timelineRef.current?.querySelector(`[data-hour="${target}"]`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <main>
      <PageHeader title="Your log" subtitle={dayLabel(selected)} />

      <div
        ref={stripRef}
        className="mt-2 flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {weeks.map((week, i) => (
          <div key={i} className="flex w-full shrink-0 snap-center justify-between gap-1 px-5">
            {week.map((d) => {
              const active = d.key === selected;
              const future = d.key > today;
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={future}
                  onClick={() => setSelected(d.key)}
                  className={cn(
                    "flex min-h-[64px] w-11 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground",
                    future && "opacity-35",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase",
                      active ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {d.letter}
                  </span>
                  <span className="text-base font-bold">{d.num}</span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      loggedDays.has(d.key)
                        ? active
                          ? "bg-primary-foreground"
                          : "bg-brand-mid"
                        : "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div ref={timelineRef} className="px-5 pt-6">
        <div className="relative pl-[76px]">
          <span className="absolute top-2 bottom-2 left-[58px] w-px bg-border" aria-hidden="true" />

          {hours.map((h) => {
            const items = byHour.get(h) ?? [];
            const showNow = isToday && nowHour === h;
            return (
              <div key={h} data-hour={h} className="relative min-h-[56px] pb-3">
                <div className="absolute left-[-76px] flex w-[76px] items-center gap-1.5 pt-1">
                  <span className="w-[42px] text-right text-xs font-bold text-muted-foreground">
                    {(h % 12 || 12) + (h < 12 ? "am" : "pm")}
                  </span>
                  <button
                    type="button"
                    aria-label={`Add an entry at ${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`}
                    onClick={() => openAdd({ dayKey: selected, hour: h })}
                    className="flex size-[26px] items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:bg-primary-tint"
                  >
                    <Plus className="size-3.5" strokeWidth={2.5} />
                  </button>
                </div>

                {showNow ? (
                  <span
                    className="absolute top-2 left-[-19px] flex items-center"
                    aria-hidden="true"
                  >
                    <span className="size-2 rounded-full bg-primary ring-2 ring-background" />
                  </span>
                ) : null}

                <div className="space-y-2">
                  {items.map((e) => (
                    <EntryBlock key={e.item.id} entry={e} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function EntryBlock({ entry }: { entry: Entry }) {
  if (entry.kind === "medication") {
    const m = entry.item;
    return (
      <div className="flex min-h-[60px] items-center gap-3 rounded-[18px] bg-primary p-3 text-primary-foreground">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Pill className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{m.name}</p>
          <p className="text-xs font-semibold text-primary-foreground/75">{m.dose}</p>
        </div>
        <span className="text-xs font-bold text-primary-foreground/85">{timeOf(m.at)}</span>
      </div>
    );
  }

  const r = entry.item;
  const meta = METRICS[r.metric];
  const Icon = METRIC_ICONS[r.metric];
  return (
    <div className="flex min-h-[60px] items-center gap-3 rounded-[18px] bg-sun p-3 text-foreground">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
        <Icon className="size-4.5 text-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{meta.label}</p>
        <p className="font-serif text-lg leading-tight">
          {r.value}
          <span className="ml-1 font-sans text-[11px] font-semibold text-foreground/70">
            {meta.unit}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          aria-label={STATUS_META[r.status].label}
          title={STATUS_META[r.status].label}
          className={cn("size-2.5 rounded-full ring-2 ring-white", STATUS_META[r.status].dot)}
        />
        <span className="text-xs font-bold text-foreground/80">{timeOf(r.at)}</span>
      </div>
    </div>
  );
}
