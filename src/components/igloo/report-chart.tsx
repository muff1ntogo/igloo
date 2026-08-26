import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Label,
  LabelList,
} from "recharts";
import { PDF } from "@/lib/igloo-report";
import { rollingAverage } from "@/lib/igloo-metric-detail";
import type { MetricKey } from "@/lib/igloo-data";

const W = 900;
const H = 340;
const PLOT_LEFT = 56;
const PLOT_RIGHT = 16;
const TREND_COLOR = "#123247"; // Consistent neutral ink tone for trend overlays

export type ChartSpec = {
  points: { label: string; value: number }[];
  color: string;
  metric: MetricKey;
  unit: string;
  /** Aligned to points: true when medication was logged that day */
  medTicks?: boolean[];
};

/** Static (non-animated, fixed-size) recharts chart used only for PNG capture. */
function CaptureChart({ points, color, metric, unit, medTicks }: ChartSpec) {
  const isBP = metric === "bp";
  const isWeekly = points.length <= 7;
  const avgWindow = isWeekly ? 3 : 5;
  const avg = rollingAverage(
    points.map((p) => p.value),
    avgWindow,
  );

  const data = points.map((p, i) => ({
    label:
      p.label ||
      (i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0 ? p.label : ""),
    value: p.value,
    avg: Math.round(avg[i]! * 10) / 10,
  }));

  // For BP, add diastolic estimates (typically ~65% of systolic)
  const dataWithDiastolic = isBP
    ? data.map((d) => ({
        ...d,
        diastolic: Math.round(d.value * 0.65),
        diastolicAvg: Math.round(d.avg * 0.65),
      }))
    : data;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valueRange = maxVal - minVal;
  const yDomainMin = isWeekly && !isBP ? 0 : Math.max(0, minVal - valueRange * 0.1);
  const yDomainMax = maxVal + valueRange * 0.1;

  const xTickInterval = isWeekly ? 1 : Math.ceil(points.length / 6);
  const rightMargin = PLOT_RIGHT + 120;

  return (
    <LineChart
      width={W}
      height={H}
      data={isBP ? dataWithDiastolic : data}
      margin={{ top: 10, right: rightMargin, bottom: 40, left: PLOT_LEFT }}
    >
      <defs>
        <linearGradient id={`trend-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke={PDF.line} vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey="label"
        tickLine={false}
        tick={{ fontSize: 10, fill: PDF.muted }}
        interval={xTickInterval}
        tickMargin={8}
      />
      <YAxis
        tickLine={false}
        tick={{ fontSize: 10, fill: PDF.muted }}
        domain={[yDomainMin, yDomainMax]}
        tickCount={5}
        tickFormatter={(v) => (Number.isInteger(v) ? v : "")}
        width={PLOT_LEFT}
      />
      {/* Area under trend line */}
      <Line
        type="monotone"
        dataKey="avg"
        stroke="transparent"
        strokeWidth={0}
        fill={`url(#trend-${metric})`}
        activeDot={false}
      />
      {/* Trend line */}
      <Line
        type="monotone"
        dataKey="avg"
        stroke={TREND_COLOR}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        activeDot={false}
        dot={false}
      />
      {/* Raw data points - main line */}
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        activeDot={false}
        dot={false}
      />
      {/* Latest point highlight */}
      <circle
        cx={0}
        cy={0}
        r={6}
        fill={color}
        stroke={PDF.white}
        strokeWidth={3}
        style={{ filter: "url(#shadow)" }}
      />
      {/* Diastolic line for BP */}
      {isBP && (
        <>
          <Line
            type="monotone"
            dataKey="diastolicAvg"
            stroke={TREND_COLOR}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
            activeDot={false}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            strokeLinecap="round"
            activeDot={false}
            dot={false}
          />
        </>
      )}
      {/* Medication ticks on X axis */}
      {medTicks &&
        medTicks.map((tick, i) =>
          tick ? (
            <line
              key={i}
              x1={0}
              y1={H - 50}
              x2={0}
              y2={H - 38}
              stroke={PDF.accent}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null,
        )}
      <Label
        value={unit}
        position="left"
        offset={-PLOT_LEFT + 8}
        angle={-90}
        style={{ fontSize: 10, fill: PDF.muted, textAnchor: "middle" }}
      />
    </LineChart>
  );
}

export type CombinedChartSpec = {
  /** All sections to overlay, oldest-first day alignment */
  sections: Array<{
    points: { label: string; value: number }[];
    color: string;
    metric: MetricKey;
    unit: string;
  }>;
  /** Aligned to points: true when medication was logged that day */
  medTicks?: boolean[];
};

/** Combined chart overlaying all metrics on a shared time axis. */
function CombinedCaptureChart({ sections, medTicks }: CombinedChartSpec) {
  if (sections.length === 0) return null;

  const isWeekly = sections[0].points.length <= 7;
  const xTickInterval = isWeekly ? 1 : Math.ceil(sections[0].points.length / 6);

  // Build combined data - align all metrics to the same day labels
  const combinedData = sections[0].points.map((p, i) => {
    const entry: Record<string, unknown> = { label: p.label };
    sections.forEach((sec) => {
      const metricKey = sec.metric;
      entry[`${metricKey}_value`] = sec.points[i]?.value ?? null;
      const avg = rollingAverage(
        sec.points.map((pt) => pt.value),
        isWeekly ? 3 : 5,
      );
      entry[`${metricKey}_avg`] = Math.round(avg[i]! * 10) / 10;
    });
    return entry;
  });

  // Find global min/max across all metrics
  let globalMin = Infinity;
  let globalMax = -Infinity;
  sections.forEach((sec) => {
    const vals = sec.points.map((p) => p.value).filter((v) => v !== null && v !== undefined);
    if (vals.length) {
      globalMin = Math.min(globalMin, Math.min(...vals));
      globalMax = Math.max(globalMax, Math.max(...vals));
    }
  });
  const valueRange = globalMax - globalMin || 1;
  const yDomainMin = isWeekly ? 0 : Math.max(0, globalMin - valueRange * 0.1);
  const yDomainMax = globalMax + valueRange * 0.1;
  const rightMargin = PLOT_RIGHT + 160;

  return (
    <LineChart
      width={W}
      height={H}
      data={combinedData}
      margin={{ top: 10, right: rightMargin, bottom: 40, left: PLOT_LEFT }}
    >
      <CartesianGrid stroke={PDF.line} vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey="label"
        tickLine={false}
        tick={{ fontSize: 10, fill: PDF.muted }}
        interval={xTickInterval}
        tickMargin={8}
      />
      <YAxis
        tickLine={false}
        tick={{ fontSize: 10, fill: PDF.muted }}
        domain={[yDomainMin, yDomainMax]}
        tickCount={5}
        tickFormatter={(v) => (Number.isInteger(v) ? v : "")}
        width={PLOT_LEFT}
      />
      {sections.map((sec) => (
        <>
          <defs key={`grad-${sec.metric}`}>
            <linearGradient id={`trend-${sec.metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sec.color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={sec.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Area under trend line */}
          <Line
            key={`area-${sec.metric}`}
            type="monotone"
            dataKey={`${sec.metric}_avg`}
            stroke="transparent"
            strokeWidth={0}
            fill={`url(#trend-${sec.metric})`}
            activeDot={false}
          />
          {/* Trend line */}
          <Line
            key={`trend-${sec.metric}`}
            type="monotone"
            dataKey={`${sec.metric}_avg`}
            stroke={TREND_COLOR}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            activeDot={false}
            dot={false}
          />
          {/* Raw data line */}
          <Line
            key={`line-${sec.metric}`}
            type="monotone"
            dataKey={`${sec.metric}_value`}
            stroke={sec.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            activeDot={false}
            dot={false}
          />
          {/* Latest point highlight */}
          <circle
            key={`dot-${sec.metric}`}
            cx={0}
            cy={0}
            r={5}
            fill={sec.color}
            stroke={PDF.white}
            strokeWidth={2.5}
          />
        </>
      ))}
      {/* Medication ticks on X axis */}
      {medTicks &&
        medTicks.map((tick, i) =>
          tick ? (
            <line
              key={i}
              x1={0}
              y1={H - 50}
              x2={0}
              y2={H - 38}
              stroke={PDF.accent}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null,
        )}
      {/* Legend for units */}
      {sections.map((sec, idx) => (
        <Label
          key={sec.metric}
          value={`${sec.unit}`}
          position="right"
          offset={8 + idx * 24}
          style={{ fontSize: 9, fill: sec.color, textAnchor: "start", fontWeight: 600 }}
        />
      ))}
    </LineChart>
  );
}

/** Renders the combined chart offscreen, snapshots it to a PNG data URL, then cleans up. */
export async function captureCombinedChart(spec: CombinedChartSpec): Promise<string> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;top:0;left:-${W + 200}px;width:${W}px;background:#FFFFFF;color:${PDF.ink};z-index:-1;`;
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<CombinedCaptureChart {...spec} />);

  await new Promise((r) => setTimeout(r, 200));

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
