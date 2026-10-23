import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { KpiCard } from './components/KpiCard'
import { formatNumber, formatPercent, getYearResults, summarizeElection } from './data/analytics'
import { fetchConstituencyData } from './data/constituencyApi'
import './App.css'

const partyColors = {
  'Party A': '#3959d9',
  'Party B': '#f29b38',
  'Party C': '#31a885',
  Others: '#a8b0c1',
}
const chartPartyOrder = ['Party A', 'Party B', 'Party C', 'Others']
const navItems = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'parliamentary', label: 'Parliamentary results', icon: '▤' },
  { id: 'assembly', label: 'Assembly explorer', icon: '⌖' },
  { id: 'trends', label: 'Electoral trends', icon: '↗' },
]

function LoadingState() {
  return (
    <div className="state-card" role="status">
      <span className="loader" />
      <strong>Loading constituency data</strong>
      <span>Connecting to the local demonstration API…</span>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="state-card error-state" role="alert">
      <span className="state-symbol">!</span>
      <strong>We couldn’t load this dashboard</strong>
      <span>Please try loading the constituency data again.</span>
      <button className="button button-primary" onClick={onRetry}>Try again</button>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  right,
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {right}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <article className={`panel chart-panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="chart-menu" aria-hidden="true">···</span>
      </div>
      {children}
    </article>
  )
}

function yearLabel(year) {
  return year === 'all' ? 'All election years' : String(year)
}

function buildPartyTrend(results) {
  return results.map((result) => {
    const summary = summarizeElection(result)
    const row = { year: result.year }
    for (const party of chartPartyOrder) {
      row[party] = summary.candidates
        .filter((candidate) => candidate.party === party)
        .reduce((total, candidate) => total + (candidate.voteShare ?? 0), 0)
    }
    return row
  })
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedAssembly, setSelectedAssembly] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('votes-desc')
  const [activeNav, setActiveNav] = useState('overview')

  useEffect(() => {
    let active = true
    fetchConstituencyData()
      .then((response) => {
        if (active) {
          setData(response)
          setSelectedAssembly(response.assemblyConstituencies[0]?.name ?? '')
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [reload])

  useEffect(() => {
    let frame = 0
    const updateActiveSection = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const marker = window.scrollY + Math.min(220, window.innerHeight * 0.3)
        let currentSection = navItems[0].id

        for (const item of navItems) {
          const section = document.getElementById(item.id)
          if (section && section.offsetTop <= marker) currentSection = item.id
        }

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          currentSection = navItems[navItems.length - 1].id
        }

        setActiveNav((current) => current === currentSection ? current : currentSection)
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])

  const availableResults = useMemo(
    () => data ? getYearResults(data.parliamentaryResults, selectedYear) : [],
    [data, selectedYear],
  )
  const tableRows = useMemo(() => {
    const rows = availableResults.flatMap((result) =>
      summarizeElection(result).candidates.map((candidate) => ({ ...candidate, year: result.year })),
    ).filter((row) =>
      `${row.candidate} ${row.party} ${row.year}`.toLowerCase().includes(search.trim().toLowerCase()),
    )
    return [...rows].sort((first, second) => {
      if (sortOrder === 'votes-asc') return first.votes - second.votes
      if (sortOrder === 'year-desc') return second.year - first.year || second.votes - first.votes
      return second.votes - first.votes
    })
  }, [availableResults, search, sortOrder])

  if (loading) return <div className="full-state"><LoadingState /></div>
  if (error || !data) return <div className="full-state"><ErrorState onRetry={() => {
    setLoading(true)
    setError(false)
    setReload((value) => value + 1)
  }} /></div>

  const selectedAssemblyData = data.assemblyConstituencies.find((assembly) => assembly.name === selectedAssembly)
  const assemblyResults = selectedAssemblyData ? getYearResults(selectedAssemblyData.results, selectedYear) : []
  const latestResult = availableResults.length > 0
    ? availableResults[availableResults.length - 1]
    : null
  const latestSummary = latestResult ? summarizeElection(latestResult) : null
  const trendResults = availableResults
  const partyTrend = buildPartyTrend(trendResults)
  const assemblyComparison = data.assemblyConstituencies.map((assembly) => {
    const result = getYearResults(assembly.results, selectedYear).at(-1)
    const summary = result ? summarizeElection(result) : null
    return {
      assembly: assembly.name.replace('Varanasi ', ''),
      'Party A': summary?.candidates.find((candidate) => candidate.party === 'Party A')?.votes ?? 0,
      'Party B': summary?.candidates.find((candidate) => candidate.party === 'Party B')?.votes ?? 0,
      year: result?.year,
    }
  })
  const selectedAssemblyChart = assemblyResults.map((result) => {
    const summary = summarizeElection(result)
    return {
      year: result.year,
      ...Object.fromEntries(chartPartyOrder.map((party) => [
        party,
        summary.candidates
          .filter((candidate) => candidate.party === party)
          .reduce((total, candidate) => total + candidate.votes, 0),
      ])),
    }
  })
  const candidatePie = latestSummary?.candidates.map((candidate) => ({
    name: candidate.party,
    value: candidate.voteShare ?? 0,
  })) ?? []
  const yearControl = (
    <label className="filter-control">
      <span>Election year</span>
      <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
        <option value="all">All years</option>
        {[...data.parliamentaryResults].reverse().map((result) => <option key={result.year} value={result.year}>{result.year}</option>)}
      </select>
    </label>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="CivicLens home">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy">Civic<span className="brand-light">Lens</span><small>INDIA ELECTION INSIGHTS</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-link ${activeNav === item.id ? 'active' : ''}`}
              href={`#${item.id}`}
              aria-label={item.label}
              title={item.label}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
              {item.id === 'overview' && <span className="nav-indicator" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note-icon">i</div>
          <strong>About this dashboard</strong>
          <p>Exploratory view of constituency-level electoral data.</p>
          <a href="#trends" onClick={() => setActiveNav('trends')}>Election trends <span aria-hidden="true">↗</span></a>
        </div>
        <div className="profile">
          <div className="profile-avatar">CL</div>
          <div><strong>Research workspace</strong><span>India · Lok Sabha</span></div>
          <span className="profile-menu" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Constituencies</span><span>/</span><strong>{data.name}</strong></div>
          <div className="topbar-right">
            <span className="updated-label"><span className="live-dot" /> Demo data loaded</span>
            <button className="icon-button" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></button>
            <div className="topbar-avatar" aria-label="User profile">R</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-intro" id="overview">
            <div>
              <div className="intro-meta"><span className="location-dot">⌖</span> UTTAR PRADESH <span className="meta-divider">/</span> LOK SABHA</div>
              <h1>{data.name}<span className="constituency-number">No. {data.number}</span></h1>
              <p className="intro-subtitle">{data.district} district · {data.state} · Parliamentary constituency</p>
            </div>
            <div className="intro-actions">
              <span className="data-badge"><span /> Illustrative dataset</span>
              <button className="button button-secondary" onClick={() => window.print()}><span aria-hidden="true">↧</span> Export view</button>
            </div>
          </section>

          <section className="overview-section">
            <SectionHeading
              eyebrow="CONSTITUENCY SNAPSHOT"
              title="At a glance"
              description="Key indicators for the selected election period."
              right={yearControl}
            />
            <div className="kpi-grid">
              <KpiCard
                label="Registered electors"
                value={latestResult ? formatNumber(latestResult.registeredElectors) : 'Unavailable'}
                note={latestResult ? `Demonstration figure · ${latestResult.year}` : 'No results for this year'}
                icon="♙"
                tone="blue"
              />
              <KpiCard
                label="Voter turnout"
                value={latestSummary ? formatPercent(latestSummary.turnout) : 'Unavailable'}
                note={latestResult ? `${formatNumber(latestResult.votesPolled)} votes polled · ${latestResult.year}` : 'No results for this year'}
                icon="◉"
                tone="orange"
              />
              <KpiCard
                label="Winning margin"
                value={latestSummary ? formatNumber(latestSummary.marginVotes) : 'Unavailable'}
                note={latestSummary ? `${formatPercent(latestSummary.marginShare)} of valid votes` : 'No results for this year'}
                icon="↗"
                tone="green"
              />
              <KpiCard
                label="Assembly segments"
                value={formatNumber(data.assemblyConstituencies.length)}
                note={`${data.assemblyConstituencies.length} constituencies represented`}
                icon="⌖"
                tone="violet"
              />
            </div>
          </section>

          <section className="overview-grid">
            <article className="panel profile-panel">
              <div className="panel-heading">
                <div><h3>Constituency profile</h3><p>Administrative and demographic context</p></div>
                <span className="profile-symbol" aria-hidden="true">⌖</span>
              </div>
              <div className="profile-details">
                <div className="profile-detail"><span>Parliamentary constituency</span><strong>{data.name} <small>({data.number})</small></strong></div>
                <div className="profile-detail"><span>State / district</span><strong>{data.state}<small>{data.district} district</small></strong></div>
                <div className="profile-detail"><span>Assembly constituencies</span><strong>{data.assemblyConstituencies.length} segments<small>Assembly numbers 387–391</small></strong></div>
              </div>
              <div className="assembly-pills">
                {data.assemblyConstituencies.map((assembly) => <button key={assembly.name} onClick={() => { setSelectedAssembly(assembly.name); document.getElementById('assembly')?.scrollIntoView({ behavior: 'smooth' }) }}>{assembly.name}<span>{assembly.number}</span></button>)}
              </div>
            </article>
            <ChartCard title="Latest vote distribution" subtitle={latestResult ? `Vote share by party · ${latestResult.year}` : 'No election data for this year'} className="distribution-panel">
              {candidatePie.length > 0 ? (
                <div className="distribution-chart">
                  <div className="pie-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={candidatePie} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="90%" paddingAngle={3} stroke="none">
                          {candidatePie.map((entry) => <Cell key={entry.name} fill={partyColors[entry.name] ?? partyColors.Others} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Vote share']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center"><strong>{latestResult?.year}</strong><span>election</span></div>
                  </div>
                  <div className="chart-legend">
                    {candidatePie.map((entry) => <div key={entry.name}><span style={{ backgroundColor: partyColors[entry.name] ?? partyColors.Others }} /><span>{entry.name}</span><strong>{formatPercent(entry.value)}</strong></div>)}
                  </div>
                </div>
              ) : <p className="empty-chart">No election data available for {yearLabel(selectedYear)}.</p>}
            </ChartCard>
          </section>

          <section className="dashboard-section" id="parliamentary">
            <SectionHeading
              eyebrow="LOK SABHA ELECTIONS"
              title="Parliamentary results"
              description="Compare party vote share and candidate performance over time."
              right={<span className="section-period">{yearLabel(selectedYear)}</span>}
            />
            <div className="chart-grid">
              <ChartCard title="Party vote share" subtitle="Share of total valid votes (%)" className="wide-chart">
                {partyTrend.length > 0 ? (
                  <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={partyTrend} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#edf0f5" vertical={false} />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 11 }} tickFormatter={(value) => `${value}%`} domain={[0, 65]} />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Vote share']} />
                        <Legend iconType="circle" iconSize={7} />
                        {chartPartyOrder.map((party) => <Line key={party} type="monotone" dataKey={party} stroke={partyColors[party]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="empty-chart">No election data available for {yearLabel(selectedYear)}.</p>}
                <p className="chart-footnote">Vote share = candidate votes ÷ total valid votes × 100. Values are illustrative.</p>
              </ChartCard>
              <article className="panel margin-panel">
                <div className="panel-heading"><div><h3>Winning margin</h3><p>Votes between winner and runner-up</p></div><span className="margin-icon">↗</span></div>
                <div className="margin-list">
                  {trendResults.map((result) => {
                    const summary = summarizeElection(result)
                    return <div className="margin-row" key={result.year}><div className="margin-year">{result.year}<span>{summary.winner?.party ?? 'No winner'}</span></div><div className="margin-value">{formatNumber(summary.marginVotes)}<small>{formatPercent(summary.marginShare)} of valid votes</small></div></div>
                  })}
                  {trendResults.length === 0 && <p className="empty-chart compact">No margin data available.</p>}
                </div>
                <p className="chart-footnote">Margin % = winning margin ÷ total valid votes × 100.</p>
              </article>
            </div>
            <article className="panel results-panel">
              <div className="panel-heading results-heading">
                <div><h3>Candidate results</h3><p>Candidate-level vote totals and calculated vote share</p></div>
                <div className="table-controls">
                  <label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search candidates" placeholder="Search candidate or party" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                  <label className="sort-select"><span className="sr-only">Sort results</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="votes-desc">Most votes</option><option value="votes-asc">Fewest votes</option><option value="year-desc">Newest year</option></select></label>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>YEAR</th><th>CANDIDATE</th><th>PARTY</th><th>VOTES</th><th>VOTE SHARE</th><th>RESULT</th></tr></thead>
                  <tbody>
                    {tableRows.map((row) => {
                      const election = availableResults.find((result) => result.year === row.year)
                      const winner = election ? summarizeElection(election).winner?.candidate === row.candidate : false
                      return <tr key={`${row.year}-${row.candidate}-${row.party}`}><td>{row.year}</td><td className="candidate-name">{row.candidate}</td><td><span className="party-tag"><span style={{ backgroundColor: partyColors[row.party] ?? partyColors.Others }} />{row.party}</span></td><td>{formatNumber(row.votes)}</td><td>{formatPercent(row.voteShare)}</td><td>{winner ? <span className="winner-pill">Winner</span> : <span className="muted-dash">—</span>}</td></tr>
                    })}
                    {tableRows.length === 0 && <tr><td colSpan={6} className="empty-table">{search ? 'No candidates match your search.' : `No candidate data available for ${yearLabel(selectedYear)}.`}</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing {tableRows.length} candidate results</span><span>Illustrative sample · not official results</span></div>
            </article>
          </section>

          <section className="dashboard-section" id="assembly">
            <SectionHeading
              eyebrow="ASSEMBLY CONSTITUENCY EXPLORER"
              title="Explore the assembly segments"
              description="Compare party performance across the five assembly constituencies."
              right={<div className="assembly-filters">
                <label className="filter-control"><span>Assembly constituency</span><select value={selectedAssembly} onChange={(event) => setSelectedAssembly(event.target.value)}>{data.assemblyConstituencies.map((assembly) => <option key={assembly.name} value={assembly.name}>{assembly.name} · {assembly.number}</option>)}</select></label>
                {yearControl}
              </div>}
            />
            <div className="chart-grid">
              <ChartCard title="Assembly-level comparison" subtitle={`Candidate votes by assembly · ${yearLabel(selectedYear)}`} className="wide-chart">
                {assemblyComparison.some((entry) => entry['Party A'] > 0) ? (
                  <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={assemblyComparison} margin={{ top: 10, right: 18, left: 0, bottom: 0 }} barGap={7}>
                        <CartesianGrid stroke="#edf0f5" vertical={false} />
                        <XAxis dataKey="assembly" tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Votes']} />
                        <Legend iconType="circle" iconSize={7} />
                        <Bar dataKey="Party A" fill={partyColors['Party A']} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Party B" fill={partyColors['Party B']} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="empty-chart">No assembly results available for {yearLabel(selectedYear)}.</p>}
                <p className="chart-footnote">Assembly totals are independently simulated examples and are not official election records.</p>
              </ChartCard>
              <ChartCard title={selectedAssemblyData?.name ?? 'Assembly constituency'} subtitle={`Candidate votes by year · ${selectedAssemblyData?.number ?? ''}`}>
                {selectedAssemblyChart.length > 0 ? (
                  <div className="chart-area compact-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAssemblyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#edf0f5" vertical={false} />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Votes']} />
                        {chartPartyOrder.map((party) => <Line key={party} type="monotone" dataKey={party} stroke={partyColors[party]} strokeWidth={2} dot={{ r: 3 }} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="empty-chart">No assembly results available for {yearLabel(selectedYear)}.</p>}
              </ChartCard>
            </div>
            <article className="panel assembly-result-panel">
              <div className="panel-heading">
                <div><h3>{selectedAssemblyData?.name ?? 'Assembly'} election results</h3><p>Candidate votes, vote share, and winning margin</p></div>
                <span className="assembly-number">AC {selectedAssemblyData?.number ?? '—'}</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>YEAR</th><th>CANDIDATE</th><th>PARTY</th><th>VOTES</th><th>VOTE SHARE</th><th>MARGIN</th></tr></thead>
                  <tbody>
                    {assemblyResults.flatMap((result) => {
                      const summary = summarizeElection(result)
                      return summary.candidates.map((candidate, index) => <tr key={`${result.year}-${candidate.candidate}-${candidate.party}`}><td>{result.year}</td><td className="candidate-name">{candidate.candidate}</td><td><span className="party-tag"><span style={{ backgroundColor: partyColors[candidate.party] ?? partyColors.Others }} />{candidate.party}</span></td><td>{formatNumber(candidate.votes)}</td><td>{formatPercent(candidate.voteShare)}</td><td>{index === 0 ? <strong className="margin-table-value">{formatNumber(summary.marginVotes)}</strong> : <span className="muted-dash">—</span>}</td></tr>)
                    })}
                    {assemblyResults.length === 0 && <tr><td colSpan={6} className="empty-table">No assembly results available for {yearLabel(selectedYear)}.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="dashboard-section trends-section" id="trends">
            <SectionHeading
              eyebrow="ELECTORAL TRENDS"
              title="A closer look at the numbers"
              description="Turnout, electoral margins, and available demographic context."
            />
            <div className="trend-grid">
              <article className="panel trend-card">
                <div className="trend-card-head"><span className="trend-icon turnout-icon">◉</span><span className="trend-label">TURNOUT TREND</span></div>
                {trendResults.length > 0 ? (
                  <div className="trend-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendResults.map((result) => ({ year: result.year, turnout: summarizeElection(result).turnout ?? 0 }))} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#edf0f5" vertical={false} />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 11 }} />
                        <YAxis domain={[50, 75]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: '#8992a5', fontSize: 10 }} />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Turnout']} />
                        <Line type="monotone" dataKey="turnout" stroke="#3959d9" strokeWidth={2.5} dot={{ fill: '#3959d9', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="empty-chart">Turnout data is unavailable for {yearLabel(selectedYear)}.</p>}
                <p className="chart-footnote">Votes polled ÷ registered electors × 100.</p>
              </article>
              <article className="panel demographic-card">
                <div className="panel-heading"><div><h3>Demographic context</h3><p>Reference year: {data.demographics.referenceYear}</p></div><span className="demographic-icon">▦</span></div>
                <div className="demographic-list">
                  {[['Population', data.demographics.population], ['Female population', data.demographics.femaleShare], ['Rural population', data.demographics.ruralShare], ['Literacy rate', data.demographics.literacyRate], ['SC / ST population', data.demographics.scStShare]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value === null ? 'Unavailable' : formatPercent(Number(value))}</strong></div>)}
                </div>
                <p className="chart-footnote">No demographic values are included in this demonstration dataset.</p>
              </article>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

export default App
