import { Link } from "@tanstack/react-router";
import { Home, ListOrdered, Plus, Users, User } from "lucide-react";
import { useIgloo } from "@/lib/igloo-store";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/log", label: "Log", icon: ListOrdered },
  { to: "/family", label: "Family", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function TabBar() {
  const { setAddOpen } = useIgloo();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-2 pb-2">
        {TABS.slice(0, 2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add a reading"
            className="-mt-8 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] ring-4 ring-card transition-transform active:scale-95"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </div>

        {TABS.slice(2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-muted-foreground transition-colors"
      activeProps={{ className: "text-primary" }}
    >
      <Icon className="size-6" />
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
}
