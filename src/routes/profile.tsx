import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  HeartHandshake,
  LifeBuoy,
  LogOut,
  Smartphone,
  Sun,
  Watch,
} from "lucide-react";
import { toast } from "sonner";
import { IglooToggle } from "@/components/igloo/Toggle";
import { useIgloo } from "@/lib/igloo-store";
import { PageHeader, PulseLine } from "@/components/igloo/ui";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Igloo" },
      {
        name: "description",
        content: "Your details, a simpler view of the home screen, connected apps and support.",
      },
      { property: "og:title", content: "Profile — Igloo" },
      {
        property: "og:description",
        content: "Your details, a simpler home screen, connected apps and support.",
      },
    ],
  }),
  component: ProfilePage,
});

const GROUPS = [
  {
    title: "Preferences",
    rows: [
      { icon: Bell, label: "Reminders", hint: "3 a day" },
      { icon: Sun, label: "Text size", hint: "Large" },
    ],
  },
  {
    title: "Connected apps",
    rows: [
      { icon: Watch, label: "Wrist monitor", hint: "Connected" },
      { icon: Smartphone, label: "Health app", hint: "Syncing" },
    ],
  },
  {
    title: "Support",
    rows: [
      { icon: LifeBuoy, label: "Help centre", hint: "" },
      { icon: HeartHandshake, label: "Talk to a person", hint: "" },
    ],
  },
];

function ProfilePage() {
  const { simpleView, setSimpleView } = useIgloo();

  return (
    <main>
      <PageHeader title="Profile" subtitle="Your Igloo" />

      <div className="space-y-5 px-5 pt-2">
        <section className="card-igloo flex items-center gap-4 p-5">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint font-serif text-2xl text-primary">
            RW
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">Rosemary Whitfield</h2>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              rosemary.w@email.com
            </p>
            <PulseLine className="mt-2 h-3 w-16" />
          </div>
        </section>

        <label className="card-igloo flex cursor-pointer items-center gap-4 p-5">
          <span className="flex-1">
            <span className="block text-base font-bold text-foreground">Simple view</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Show one large card on the home screen instead of the grid.
            </span>
          </span>
          <IglooToggle
            label="Simple view"
            checked={simpleView}
            onChange={(v) => {
              setSimpleView(v);
              toast.success(v ? "Simple view is on." : "Simple view is off.");
            }}
          />
        </label>

        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="px-1 pb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              {g.title}
            </h2>
            <div className="card-igloo divide-y divide-border overflow-hidden">
              {g.rows.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => toast("Coming soon in the prototype.")}
                  className="flex min-h-[60px] w-full items-center gap-4 px-5 py-3 text-left"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary-tint">
                    <r.icon className="size-5 text-primary" />
                  </span>
                  <span className="flex-1 text-base font-semibold text-foreground">{r.label}</span>
                  {r.hint ? (
                    <span className="text-sm font-semibold text-muted-foreground">{r.hint}</span>
                  ) : null}
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => toast("Signed out (prototype).")}
          className="card-igloo flex min-h-[60px] w-full items-center gap-4 px-5 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-urgent-tint">
            <LogOut className="size-5 text-urgent" />
          </span>
          <span className="flex-1 text-base font-bold text-urgent">Sign out</span>
        </button>
      </div>
    </main>
  );
}
