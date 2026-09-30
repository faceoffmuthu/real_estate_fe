const COLORS = ['#9B3A63', '#258F91', '#5573D8', '#8C5CC7', '#CE8A36', '#45916C']
const DARK_COLORS = ['#68203F', '#176C6E', '#344FAE', '#63408D', '#985B17', '#2C694A']

function colorIndex(key: string): number {
  const hash = [...key].reduce((total, character) => total + character.charCodeAt(0), 0)
  return hash % COLORS.length
}

export function dashboardColorForKey(key: string): string {
  return COLORS[colorIndex(key)]
}

export function dashboardIconColorForKey(key: string): string {
  return DARK_COLORS[colorIndex(key)]
}

/** Compact multicolor decorative bar chart for KPI cards. */
export function DashboardSparkline({ series, colorKey = '', className = '' }: { series?: number[]; colorKey?: string; className?: string }) {
  const values = series && series.length > 0 && series.every(Number.isFinite)
    ? series
    : [36, 30, 18, 13, 14, 11, 9, 4]
  const max = Math.max(1, ...values)
  const baseline = 42
  const chartHeight = 36
  const step = 100 / values.length
  const baseColor = colorIndex(colorKey)
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 100 48" preserveAspectRatio="none" className={`dashboard-sparkline block h-8 w-full opacity-50 ${className}`}>
    {[6, 15, 24, 33, baseline].map(y => <path key={`row-${y}`} d={`M 1 ${y} H 99`} fill="none" stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="0.7" />)}
    {values.map((value, index) => {
      const barWidth = Math.max(2, step * 0.62)
      const barHeight = Math.max(1, (Math.max(0, value) / max) * chartHeight)
      const x = index * step + (step - barWidth) / 2
      const color = COLORS[(baseColor + index) % COLORS.length]
      return <rect key={`bar-${index}`} x={x} y={baseline - barHeight} width={barWidth} height={barHeight} rx="0.5" fill={color} fillOpacity="0.82" />
    })}
  </svg>
}
