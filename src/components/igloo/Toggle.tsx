import { cn } from "@/lib/utils";

/** Large, high-contrast switch sized for older hands. */
export function IglooToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[34px] w-[58px] shrink-0 rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-[26px] -translate-y-1/2 rounded-full bg-card shadow-sm transition-all",
          checked ? "left-[28px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
