import { useEffect, useState } from "react";
import type { Status } from "@/lib/igloo-data";
import { cn } from "@/lib/utils";

/**
 * Igloo's mascot: a small round-shelled tortoise, flat-illustrated in
 * palette colours. Three calm expression states. Reusable anywhere a
 * status needs a friendly face (detail screen, dashboard alert banner).
 */
export function Tortoise({
  status,
  size = "md",
  className,
}: {
  status: Status;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const t = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(t);
  }, [status]);

  const px = size === "lg" ? "size-24" : size === "sm" ? "size-11" : "size-16";
  const shell =
    status === "good"
      ? "text-good"
      : status === "watch"
        ? "text-watch"
        : "text-urgent";
  const tilt = status === "watch" ? "rotate-[-6deg]" : "";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-all duration-300 ease-out",
        shown ? "scale-100 opacity-100" : "scale-90 opacity-0",
        className,
      )}
    >
      <svg
        viewBox="0 0 96 80"
        className={cn(px, shell, tilt, "transition-transform duration-300")}
        role="img"
        aria-label={`Tortoise mascot, ${status} status`}
      >
        {/* body */}
        <path
          d="M14 60c0-16 14-28 32-28s32 12 32 28z"
          fill="currentColor"
          opacity="0.16"
        />
        {/* shell */}
        <path
          d="M18 58c0-17 13-30 28-30s28 13 28 30z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* shell plates */}
        <g stroke="var(--color-card)" strokeWidth="2" fill="none" opacity="0.85">
          <path d="M46 28v30" />
          <path d="M28 44c8-3 28-3 36 0" />
        </g>
        {/* legs */}
        <rect x="24" y="56" width="12" height="8" rx="4" fill="currentColor" opacity="0.55" />
        <rect x="56" y="56" width="12" height="8" rx="4" fill="currentColor" opacity="0.55" />
        {/* head */}
        <g transform={status === "watch" ? "translate(2,-2) rotate(-8 82 50)" : ""}>
          <rect x="70" y="40" width="20" height="18" rx="9" fill="currentColor" opacity="0.62" />
          {status === "urgent" ? (
            <>
              <path d="M76 47.5h3.4" stroke="var(--color-card)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M83.6 47.5H87" stroke="var(--color-card)" strokeWidth="2.4" strokeLinecap="round" />
              <path
                d="M78 54c2.4-2 5-2 7 0"
                stroke="var(--color-card)"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <circle cx="78" cy="47" r="1.7" fill="var(--color-card)" />
              <circle cx="86" cy="47" r="1.7" fill="var(--color-card)" />
              <path
                d={status === "good" ? "M78 52c2.5 2.4 5 2.4 7.5 0" : "M78.5 52.5h6.5"}
                stroke="var(--color-card)"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
      </svg>
    </span>
  );
}
