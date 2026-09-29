type Point = {
  value: number;
  measuredAt: string;
};

function percentChange(points: Point[]) {
  if (points.length < 2) return null;
  const previous = points[points.length - 2].value;
  const current = points[points.length - 1].value;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function sparkline(points: Point[]) {
  if (!points.length) return "";
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 220;
  const height = 70;
  const pad = 5;

  return points
    .map((point, index) => {
      const x =
        points.length === 1
          ? width / 2
          : pad + (index / (points.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (point.value - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function LabTrendCard({
  name,
  unit,
  points
}: {
  name: string;
  unit: string | null;
  points: Point[];
}) {
  const chronological = [...points].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );
  const latest = chronological[chronological.length - 1];
  const change = percentChange(chronological);
  const line = sparkline(chronological);

  return (
    <article className="trendCard">
      <div className="trendHeader">
        <div>
          <span>{name}</span>
          <strong>
            {latest.value} {unit ?? ""}
          </strong>
        </div>
        <small>
          {change === null
            ? "비교값 없음"
            : `직전 대비 ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
        </small>
      </div>

      <svg
        className="sparkline"
        viewBox="0 0 220 70"
        role="img"
        aria-label={`${name} 최근 수치 변화`}
      >
        <polyline points={line} fill="none" vectorEffect="non-scaling-stroke" />
        {chronological.map((point, index) => {
          const values = chronological.map((item) => item.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min || 1;
          const x =
            chronological.length === 1
              ? 110
              : 5 + (index / (chronological.length - 1)) * 210;
          const y = 5 + (1 - (point.value - min) / range) * 60;
          return <circle key={index} cx={x} cy={y} r="3" />;
        })}
      </svg>

      <div className="trendMeta">
        <span>
          {new Date(chronological[0].measuredAt).toLocaleDateString("ko-KR")}
        </span>
        <span>
          {new Date(latest.measuredAt).toLocaleDateString("ko-KR")}
        </span>
      </div>
    </article>
  );
}
