import { describe, expect, it } from 'vitest'
import { formatNumber, formatPercent, getYearResults, summarizeElection } from './analytics'

const sampleElection = {
  year: 2024,
  registeredElectors: 1000,
  votesPolled: 720,
  validVotes: 700,
  candidates: [
    { candidate: 'Candidate A', party: 'Party A', votes: 420 },
    { candidate: 'Candidate B', party: 'Party B', votes: 210 },
    { candidate: 'Candidate C', party: 'Party C', votes: 70 },
  ],
}

describe('election analytics', () => {
  it('calculates vote share, winning margin, margin share, and turnout from the defined denominators', () => {
    const summary = summarizeElection(sampleElection)

    expect(summary.candidates[0].voteShare).toBe(60)
    expect(summary.marginVotes).toBe(210)
    expect(summary.marginShare).toBe(30)
    expect(summary.turnout).toBe(72)
  })

  it('marks shares and turnout unavailable when their denominators are zero', () => {
    const summary = summarizeElection({
      ...sampleElection,
      registeredElectors: 0,
      validVotes: 0,
    })

    expect(summary.candidates[0].voteShare).toBeNull()
    expect(summary.marginShare).toBeNull()
    expect(summary.turnout).toBeNull()
    expect(formatPercent(summary.turnout)).toBe('Unavailable')
    expect(formatNumber(null)).toBe('Unavailable')
  })

  it('handles an election with no candidates without inventing a winner or margin', () => {
    const summary = summarizeElection({ ...sampleElection, candidates: [] })

    expect(summary.winner).toBeNull()
    expect(summary.runnerUp).toBeNull()
    expect(summary.marginVotes).toBeNull()
  })

  it('ignores malformed candidate counts and marks invalid denominators unavailable', () => {
    const summary = summarizeElection({
      ...sampleElection,
      validVotes: Number.NaN,
      registeredElectors: Number.POSITIVE_INFINITY,
      candidates: [
        ...sampleElection.candidates,
        { candidate: 'Invalid entry', party: 'Party D', votes: -1 },
      ],
    })

    expect(summary.candidates).toHaveLength(3)
    expect(summary.candidates[0].voteShare).toBeNull()
    expect(summary.marginVotes).toBe(210)
    expect(summary.marginShare).toBeNull()
    expect(summary.turnout).toBeNull()
  })

  it('filters results to the selected year while retaining all years for the all-years option', () => {
    const results = [sampleElection, { ...sampleElection, year: 2019 }]

    expect(getYearResults(results, 2019).map((result) => result.year)).toEqual([2019])
    expect(getYearResults(results, 'all')).toHaveLength(2)
  })
})
