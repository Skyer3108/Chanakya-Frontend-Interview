# CivicLens: Parliamentary Constituency Dashboard

A responsive React, JavaScript, Vite, and Tailwind CSS dashboard prototype for exploring a sample Indian Parliamentary Constituency. The selected constituency is Varanasi (Uttar Pradesh). Charts are built with Recharts. Tailwind CSS v4 is integrated through its Vite plugin; shared component styling uses Tailwind utility directives via `@apply`.

## Start the application

```sh
npm install
npm run dev
```

Production build, lint, and test:

```sh
npm run lint
npm run test
npm run build
```

## Data and limitations

The frontend loads its data asynchronously through `fetchConstituencyData()` in `src/data/constituencyApi.js`, a local mock API that returns a cloned demonstration response. This keeps the API boundary separate from the UI and can be replaced with a real service without changing the dashboard components.

**All election figures, candidates, party names, and assembly-level results in the mock response are synthetic examples. They are not official results and must not be cited as historical facts.** The Varanasi constituency and assembly segment identifiers/names are included to give the prototype context; verify all administrative details against official records before production use. Demographic indicators intentionally show “Unavailable” because no sourced demographic values are included.

For verified data, start with:

- [Election Commission of India results portal](https://results.eci.gov.in/) — official election results. This prototype does not call the portal or claim its sample values came from it.
- [Census of India](https://censusindia.gov.in/) — official census publications. This prototype contains no census-derived statistics.

The mock response represents valid votes, votes polled, and registered electors as separate fields. Derived metrics are computed in `src/data/analytics.js`:

- Candidate vote share = candidate votes ÷ total valid votes × 100.
- Winning margin = winner’s votes − runner-up’s votes.
- Winning margin percentage = winning margin ÷ total valid votes × 100.
- Turnout = votes polled ÷ registered electors × 100. Interpret this according to the source’s definition of “votes polled” when replacing the sample API.

No individual voter behaviour is collected or inferred. Filters apply to the KPI cards, election table, and charts; assembly selection updates the segment-specific chart and result table. The candidate table supports text search and sorting. Missing data has explicit empty/unavailable states.
