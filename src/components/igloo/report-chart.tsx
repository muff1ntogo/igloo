import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { PDF } from "@/lib/igloo-report";
import { rollingAverage } from "@/lib/igloo-metric-detail";

const W = 900;
const H = 340;
const PLOT_LEFT = 56;
const PLOT_RIGHT = 16;

export type ChartSpec = {
  points: { label: string; value: number }[];
  color: string;
  /** Aligned to points: true when medication was logged that day */
  medTicks?: boolean[];
};

/** Static (non-animated, fixed-size) recharts chart used only for PNG capture. */
function CaptureChart({ points, color, medTicks }: ChartSpec) {
  const avg = rollingAverage(
    points.map((p) => p.value),
    3,
  );
  const data = points.map((p, i) => ({
    label: p.label,
    value: p.value,
    avg: Math.round(avg[i]! * 10) / 10,
  }));

  return (
    <div
      style={{
        width: W,
        background: PDF.white,
        color: PDF.ink,
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <LineChart
        width={W}
        height={H}
        data={data}
        margin={{ top: 12, right: PLOT_RIGHT, bottom: 8, left: 0 }}
      >
        <CartesianGrid stroke={PDF.line} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={PDF.muted}
          tick={{ fill: PDF.muted, fontSize: 15 }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          stroke={PDF.muted}
          tick={{ fill: PDF.muted, fontSize: 15 }}
          tickLine={false}
          width={PLOT_LEFT}
          domain={["dataMin - 4", "dataMax + 4"]}
        />
        <Line
          type="linear"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.45}
          dot={{ r: 3, fill: color, stroke: color }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke={color}
          strokeWidth={3.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>

      {medTicks ? (
        <div style={{ paddingLeft: PLOT_LEFT, paddingRight: PLOT_RIGHT }}>
          <div style={{ display: "flex", height: 26, alignItems: "flex-start" }}>
            {medTicks.map((on, i) => (
              <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                {on ? (
                  <div style={{ width: 3, height: 14, background: PDF.brand, borderRadius: 2 }} />
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: PDF.muted, paddingBottom: 4 }}>
            Ticks mark days with a medication or supplement logged.
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Renders the chart offscreen, snapshots it to a PNG data URL, then cleans up. */
export async function captureChart(spec: ChartSpec): Promise<string> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;top:0;left:-${W + 200}px;width:${W}px;background:#FFFFFF;color:${PDF.ink};z-index:-1;`;
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<CaptureChart {...spec} />);

  // Let recharts lay out and paint before snapshotting.
  await new Promise((r) => setTimeout(r, 180));

  try {
    const canvas = await html2canvas(host, {
      backgroundColor: "#FFFFFF",
      scale: 2,
      logging: false,
      useCORS: false,
    });
    return canvas.toDataURL("image/png");
  } finally {
    root.unmount();
    host.remove();
  }
}
