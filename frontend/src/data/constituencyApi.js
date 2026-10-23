const parliamentaryResults = [
  {
    year: 2014,
    registeredElectors: 1684000,
    votesPolled: 1047100,
    validVotes: 1039880,
    candidates: [
      { candidate: 'Candidate A', party: 'Party A', votes: 496200 },
      { candidate: 'Candidate B', party: 'Party B', votes: 248900 },
      { candidate: 'Candidate C', party: 'Party C', votes: 116400 },
      { candidate: 'Other candidates', party: 'Others', votes: 178380 },
    ],
  },
  {
    year: 2019,
    registeredElectors: 1867000,
    votesPolled: 1213500,
    validVotes: 1204870,
    candidates: [
      { candidate: 'Candidate A', party: 'Party A', votes: 604500 },
      { candidate: 'Candidate B', party: 'Party B', votes: 385200 },
      { candidate: 'Candidate C', party: 'Party C', votes: 73200 },
      { candidate: 'Other candidates', party: 'Others', votes: 141970 },
    ],
  },
  {
    year: 2024,
    registeredElectors: 1974000,
    votesPolled: 1296800,
    validVotes: 1289410,
    candidates: [
      { candidate: 'Candidate A', party: 'Party A', votes: 575400 },
      { candidate: 'Candidate B', party: 'Party B', votes: 463900 },
      { candidate: 'Candidate C', party: 'Party C', votes: 49700 },
      { candidate: 'Other candidates', party: 'Others', votes: 200410 },
    ],
  },
]

const assemblyNames = [
  { number: 387, name: 'Rohaniya' },
  { number: 388, name: 'Varanasi North' },
  { number: 389, name: 'Varanasi South' },
  { number: 390, name: 'Varanasi Cantt' },
  { number: 391, name: 'Sevapuri' },
]

const assemblyResults = {
  Rohaniya: [[62000, 41000, 15000], [71000, 53000, 12000], [67000, 64000, 9000]],
  'Varanasi North': [[58000, 36000, 18000], [76000, 51000, 11000], [73000, 62000, 10000]],
  'Varanasi South': [[51000, 33000, 17000], [68000, 49000, 13000], [61000, 55000, 12000]],
  'Varanasi Cantt': [[74000, 39000, 16000], [89000, 55000, 14000], [83000, 68000, 13000]],
  Sevapuri: [[55000, 48000, 11000], [67000, 61000, 9000], [64000, 59000, 10000]],
}

const assemblyConstituencies = assemblyNames.map((assembly) => ({
  ...assembly,
  results: parliamentaryResults.map((result, index) => {
    const votes = assemblyResults[assembly.name][index]
    const validVotes = Math.round(votes.reduce((total, count) => total + count, 0) * 1.012)
    return {
      year: result.year,
      registeredElectors: Math.round(validVotes / (index === 0 ? 0.62 : index === 1 ? 0.65 : 0.66)),
      votesPolled: validVotes,
      validVotes,
      candidates: [
        { candidate: 'Candidate A', party: 'Party A', votes: votes[0] },
        { candidate: 'Candidate B', party: 'Party B', votes: votes[1] },
        { candidate: 'Candidate C', party: 'Party C', votes: votes[2] },
        { candidate: 'Other candidates', party: 'Others', votes: validVotes - votes.reduce((total, count) => total + count, 0) },
      ],
    }
  }),
}))

const mockConstituency = {
  name: 'Varanasi',
  number: 39,
  state: 'Uttar Pradesh',
  district: 'Varanasi',
  assemblyConstituencies,
  parliamentaryResults,
  demographics: {
    referenceYear: 'Unavailable',
    population: null,
    femaleShare: null,
    ruralShare: null,
    literacyRate: null,
    scStShare: null,
  },
}

export async function fetchConstituencyData() {
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  return structuredClone(mockConstituency)
}
