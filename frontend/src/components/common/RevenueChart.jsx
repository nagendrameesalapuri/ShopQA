import React, { useState, useRef } from "react";

// Real SVG bar chart (not CSS-height divs) — a genuine target for advanced
// Playwright practice: asserting on SVG geometry/attributes rather than text
// content, and driving a custom hover-tooltip interaction.
export default function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const width = 700;
  const height = 220;
  const padding = { top: 10, right: 10, bottom: 28, left: 10 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const values = data.map((d) => parseFloat(d.revenue) || 0);
  const maxVal = Math.max(...values, 1);
  const barGap = 4;
  const barWidth = Math.max((plotW - barGap * (data.length - 1)) / data.length, 4);

  const gridLines = [0, 0.5, 1];

  return (
    <div style={{ position: "relative" }} data-testid="revenue-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Revenue bar chart, last 14 days"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Recessive gridlines */}
        {gridLines.map((g) => {
          const y = padding.top + plotH * (1 - g);
          return (
            <line
              key={g}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const val = parseFloat(d.revenue) || 0;
          const barH = Math.max((val / maxVal) * plotH, 2);
          const x = padding.left + i * (barWidth + barGap);
          const y = padding.top + plotH - barH;
          const isHover = hoverIndex === i;
          return (
            <g key={i}>
              {/* Invisible full-height hit target (behind the bar), so short
                  bars are easier to hover — must paint first/underneath or it
                  would intercept pointer events meant for the visible bar. */}
              <rect
                x={x}
                y={padding.top}
                width={barWidth}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={Math.min(4, barWidth / 2)}
                fill={isHover ? "var(--accent-dark)" : "var(--accent)"}
                data-testid="revenue-bar"
                data-date={d.date}
                data-revenue={val}
                onMouseEnter={() => setHoverIndex(i)}
                style={{ cursor: "pointer", transition: "fill 120ms ease" }}
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-muted)"
              >
                {new Date(d.date).getDate()}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="revenue-chart-tooltip"
          data-testid="revenue-chart-tooltip"
          style={{
            position: "absolute",
            left: `${((hoverIndex + 0.5) / data.length) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
            background: "var(--primary)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "var(--shadow)",
            marginTop: -6,
          }}
        >
          <strong>
            {new Date(data[hoverIndex].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </strong>
          <br />₹{Number(data[hoverIndex].revenue).toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
