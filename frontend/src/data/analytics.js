export function summarizeElection(result) {
  const validVotes = Number.isFinite(result.validVotes) && result.validVotes > 0
    ? result.validVotes
    : null
  const candidates = (Array.isArray(result.candidates) ? result.candidates : [])
    .filter((candidate) =>
      typeof candidate.candidate === 'string' &&
      typeof candidate.party === 'string' &&
      Number.isFinite(candidate.votes) &&
      candidate.votes >= 0,
    )
    .map((candidate) => ({
      ...candidate,
      voteShare: validVotes !== null ? (candidate.votes / validVotes) * 100 : null,
    }))
    .sort((first, second) => second.votes - first.votes)
  const winner = candidates[0]
  const runnerUp = candidates[1] ?? null
  const marginVotes = winner && runnerUp ? winner.votes - runnerUp.votes : null

  return {
    year: result.year,
    winner: winner ?? null,
    runnerUp,
    marginVotes,
    marginShare: marginVotes !== null && validVotes !== null
      ? (marginVotes / validVotes) * 100
      : null,
    turnout: Number.isFinite(result.registeredElectors) &&
      result.registeredElectors > 0 &&
      Number.isFinite(result.votesPolled) &&
      result.votesPolled >= 0
      ? (result.votesPolled / result.registeredElectors) * 100
      : null,
    candidates,
  }
}

export function formatNumber(value) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'Unavailable'
    : new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercent(value, digits = 1) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'Unavailable'
    : `${value.toFixed(digits)}%`
}

export function getYearResults(results, year) {
  return year === 'all' ? results : results.filter((result) => result.year === year)
}
