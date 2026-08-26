import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
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
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    title: "Personal details",
    rows: [{ icon: Calendar, label: "Date of birth", hint: "March 15, 1952" }],
  },
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
  const { simpleView, setSimpleView, profile, setProfile } = useIgloo();
  const [dobEditOpen, setDobEditOpen] = useState(false);
  const [dobValue, setDobValue] = useState(profile.dob);

  const handleDobSave = () => {
    setProfile({ name: profile.name, dob: dobValue });
    setDobEditOpen(false);
    toast.success("Date of birth updated.");
  };

  return (
    <main>
      <PageHeader title="Profile" subtitle="Your Igloo" />

      <div className="space-y-5 px-5 pt-2">
        <section className="card-igloo flex items-center gap-4 p-5">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint font-serif text-2xl text-primary">
            RW
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
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
              {g.rows.map((r) => {
                const isDob = r.label === "Date of birth";
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={
                      isDob
                        ? () => setDobEditOpen(true)
                        : () => toast("Coming soon in the prototype.")
                    }
                    className={cn(
                      "flex min-h-[60px] w-full items-center gap-4 px-5 py-3 text-left",
                      isDob && "cursor-pointer",
                    )}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-tint">
                      <r.icon className="size-5 text-primary" />
                    </span>
                    <span className="flex-1 text-base font-semibold text-foreground">
                      {r.label}
                    </span>
                    {r.hint ? (
                      <span className="text-sm font-semibold text-muted-foreground">{r.hint}</span>
                    ) : null}
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </button>
                );
              })}
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

        {/* DOB Edit Dialog */}
        <Dialog open={dobEditOpen} onOpenChange={setDobEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Date of Birth</DialogTitle>
              <DialogDescription>This will appear on generated health reports.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <label className="text-sm font-semibold text-foreground">
                Date of birth
                <input
                  type="date"
                  value={dobValue}
                  onChange={(e) => setDobValue(e.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 font-serif text-xl text-foreground outline-none focus:border-primary"
                />
              </label>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={handleDobSave}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 w-full"
              >
                Save
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
