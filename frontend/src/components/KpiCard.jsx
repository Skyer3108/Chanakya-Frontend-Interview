export function KpiCard({ label, value, note, icon, tone }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`} aria-hidden="true">{icon}</div>
      <div className="kpi-content">
        <p className="kpi-label">{label}</p>
        <strong className="kpi-value">{value}</strong>
        <span className="kpi-note">{note}</span>
      </div>
    </article>
  )
}
