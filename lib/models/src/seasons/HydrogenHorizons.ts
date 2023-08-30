import { AllianceMember } from '../Alliance.js';
import { Match, MatchDetailBase } from '../Match.js';
import { Ranking } from '../Ranking.js';
import { isNonNullObject, isNumber } from '../types.js';
import { Season, SeasonFunctions } from './index.js';

/**
 * Main season function declaration for the whole file.
 */
const functions: SeasonFunctions<MatchDetails, SeasonRanking> = {
  calculateRankings,
  calculateScore
};

export const HydrogenHorizonsSeason: Season<MatchDetails, SeasonRanking> = {
  key: 'fgc_2023',
  program: 'fgc',
  name: 'Hydrogen Horizons',
  functions
};

export interface MatchDetails extends MatchDetailBase {
  redHydrogenPoints: number;
  redOxygenPoints: number;
  redAlignment: number;
  redOneProficiency: number;
  redTwoProficiency: number;
  redThreeProficiency: number;
  blueHydrogenPoints: number;
  blueOxygenPoints: number;
  blueAlignment: number;
  blueOneProficiency: number;
  blueTwoProficiency: number;
  blueThreeProficiency: number;
  coopertitionBonus: number;
}

export const defaultMatchDetails: MatchDetails = {
  eventKey: '',
  id: -1,
  tournamentKey: '',
  redHydrogenPoints: 0,
  redOxygenPoints: 0,
  redAlignment: 0,
  redOneProficiency: 0,
  redTwoProficiency: 0,
  redThreeProficiency: 0,
  blueHydrogenPoints: 0,
  blueOxygenPoints: 0,
  blueAlignment: 0,
  blueOneProficiency: 0,
  blueTwoProficiency: 0,
  blueThreeProficiency: 0,
  coopertitionBonus: 0
};

export const isHydrogenHorizonsDetails = (obj: unknown): obj is MatchDetails =>
  isNonNullObject(obj) &&
  isNumber(obj.redHydrogenPoints) &&
  isNumber(obj.redOxygenPoints) &&
  isNumber(obj.blueHydrogenPoints) &&
  isNumber(obj.blue1OxygenPoints) &&
  isNumber(obj.coopertitionBonus);

export interface SeasonRanking extends Ranking {
  rankingScore: number;
  highestScore: number;
  oxyHydroPoints: number;
}

export const isHydrogenHorizonsRanking = (obj: unknown): obj is SeasonRanking =>
  isNonNullObject(obj) &&
  isNumber(obj.rankingScore) &&
  isNumber(obj.carbonPoints);

/* Functions for calculating ranks. */
function calculateRankings(
  matches: Match<MatchDetails>[],
  prevRankings: SeasonRanking[]
): SeasonRanking[] {
  const rankingMap: Map<number, SeasonRanking> = new Map();
  const scoresMap: Map<number, number[]> = new Map();

  // In this loop calculate basic W-L-T, as well as basic game information
  for (const match of matches) {
    if (!match.participants) break;
    for (const participant of match.participants) {
      if (!rankingMap.get(participant.teamKey)) {
        rankingMap.set(participant.teamKey, {
          eventKey: participant.eventKey,
          tournamentKey: participant.tournamentKey,
          oxyHydroPoints: 0,
          losses: 0,
          played: 0,
          rank: 0,
          rankChange: 0,
          rankingScore: 0,
          teamKey: participant.teamKey,
          ties: 0,
          wins: 0,
          highestScore: 0
        });
      }

      if (!scoresMap.get(participant.teamKey)) {
        scoresMap.set(participant.teamKey, []);
      }

      if (
        !isHydrogenHorizonsDetails(match.details) ||
        participant.disqualified === 1 ||
        participant.surrogate > 0
      ) {
        continue;
      }

      const ranking = {
        ...(rankingMap.get(participant.teamKey) as SeasonRanking)
      };
      const scores = scoresMap.get(participant.teamKey) as number[];
      const redWin = match.redScore > match.blueScore;
      const blueWin = match.blueScore > match.redScore;
      const isTie = match.redScore === match.blueScore;

      if (participant.station < 20) {
        // Red Alliance
        if (participant.cardStatus === 2) {
          scoresMap.set(participant.teamKey, [...scores, match.redScore]);
          ranking.losses = ranking.losses + 1;
        } else {
          scoresMap.set(participant.teamKey, [...scores, match.redScore]);
          ranking.wins = ranking.wins + (redWin ? 1 : 0);
          ranking.losses = ranking.losses + (redWin ? 0 : 1);
          ranking.ties = ranking.ties + (isTie ? 1 : 0);
          ranking.oxyHydroPoints =
            ranking.oxyHydroPoints +
            match.details.redHydrogenPoints +
            match.details.redOxygenPoints;
          if (ranking.highestScore < match.redScore) {
            ranking.highestScore = match.redScore;
          }
        }
      }

      if (participant.station >= 20) {
        // Blue Alliance
        if (participant.cardStatus === 2) {
          scoresMap.set(participant.teamKey, [...scores, match.blueScore]);
          ranking.losses = ranking.losses + 1;
        } else {
          scoresMap.set(participant.teamKey, [...scores, match.blueScore]);
          ranking.wins = ranking.wins + (blueWin ? 1 : 0);
          ranking.losses = ranking.losses + (blueWin ? 0 : 1);
          ranking.ties = ranking.ties + (isTie ? 1 : 0);
          ranking.oxyHydroPoints =
            ranking.oxyHydroPoints +
            match.details.blueHydrogenPoints +
            match.details.blueOxygenPoints;
          if (ranking.highestScore < match.blueScore) {
            ranking.highestScore = match.blueScore;
          }
        }
      }
      ranking.played = ranking.played + 1;
      rankingMap.set(participant.teamKey, ranking);
    }
  }

  // In this loop, calculate ranking score
  for (const key of rankingMap.keys()) {
    const scores = scoresMap.get(key);
    if (!scores) continue;
    const ranking = {
      ...rankingMap.get(key)
    } as SeasonRanking;

    const lowestScore = ranking.played > 0 ? Math.min(...scores) : 0;
    const index = scores.findIndex((s) => s === lowestScore);
    const newScores =
      scores.length > 1
        ? [...scores.slice(0, index), ...scores.slice(index + 1)]
        : scores;
    if (newScores.length > 0) {
      ranking.rankingScore = Math.ceil(
        newScores.reduce((prev, curr) => prev + curr) / newScores.length
      );
    } else {
      ranking.rankingScore = 0;
    }
    rankingMap.set(key, ranking);
  }

  // In this loop calculate team rankings
  const rankings = [...rankingMap.values()].sort(compareRankings);
  // In this loop calculate the rank change
  for (let i = 0; i < rankings.length; i++) {
    const prevRanking = prevRankings.find(
      (r) => r.teamKey === rankings[i].teamKey
    );
    rankings[i].rank = i + 1;
    if (prevRanking) {
      const rankDelta =
        prevRanking.rank === 0 ? 0 : prevRanking.rank - rankings[i].rank;
      rankings[i].rankChange = rankDelta;
      rankings[i].eventKey = prevRanking.eventKey;
      rankings[i].tournamentKey = prevRanking.tournamentKey;
    }
  }

  return rankings;
}

export function calculatePlayoffsRank(
  matches: Match<MatchDetails>[],
  prevRankings: SeasonRanking[],
  members: AllianceMember[]
) {
  const alliances: Map<number, SeasonRanking> = new Map();
  const rankingMap: Map<number, SeasonRanking> = new Map();

  for (const match of matches) {
    if (!match.participants) break;
    for (const participant of match.participants) {
      if (!rankingMap.get(participant.teamKey)) {
        rankingMap.set(participant.teamKey, {
          eventKey: participant.eventKey,
          tournamentKey: participant.tournamentKey,
          oxyHydroPoints: 0,
          losses: 0,
          played: 0,
          rank: 0,
          rankChange: 0,
          rankingScore: 0,
          teamKey: participant.teamKey,
          ties: 0,
          wins: 0,
          highestScore: 0
        });
      }

      if (!isHydrogenHorizonsDetails(match.details)) continue;

      const ranking = {
        ...(rankingMap.get(participant.teamKey) as SeasonRanking)
      };

      if (participant.cardStatus === 2) {
        rankingMap.set(participant.teamKey, ranking);
        continue;
      }

      if (participant.station < 20) {
        ranking.rankingScore += match.redScore;
      } else if (participant.station >= 20) {
        ranking.rankingScore += match.blueScore;
      }

      ranking.played += 1;
      rankingMap.set(participant.teamKey, ranking);
    }
  }

  const rankings = [...rankingMap.values()].sort(
    (a, b) => b.rankingScore - a.rankingScore
  );
  const rankedMembers = [...rankings].map((r) =>
    members.find((m) => m.teamKey === r.teamKey)
  );

  const allianceRankMap: Map<number, number> = new Map();
  let allianceRank = 1;
  rankedMembers.forEach((m, i) => {
    if (m?.isCaptain) {
      allianceRankMap.set(m.allianceRank, allianceRank);
      allianceRank += 1;
    }
  });

  for (let i = 0; i < rankings.length; i++) {
    const member = rankedMembers[i];
    const prevRanking = prevRankings.find(
      (r) => r.teamKey === rankings[i].teamKey
    );
    if (prevRanking && member) {
      rankings[i].rank = allianceRankMap.get(member.allianceRank) || 0;
      const rankDelta =
        prevRanking.rank === 0 ? 0 : prevRanking.rank - rankings[i].rank;
      rankings[i].rankChange = rankDelta;
      rankings[i].eventKey = prevRanking.eventKey;
      rankings[i].tournamentKey = prevRanking.tournamentKey;
    }
  }
  return rankings;
}

/* Functions for calculating score. */
export function calculateScore(match: Match<MatchDetails>): [number, number] {
  const { details } = match;
  if (!details) return [0, 0];
  const redTelePoints =
    (details.redHydrogenPoints + details.redOxygenPoints) *
    getMultiplier(details.redAlignment);
  const blueTelePoints =
    (details.blueHydrogenPoints + details.blueHydrogenPoints) *
    getMultiplier(details.blueAlignment);
  const proficiencyPoints =
    getProficiencyPoiints(details.redOneProficiency) +
    getProficiencyPoiints(details.redTwoProficiency) +
    getProficiencyPoiints(details.redThreeProficiency) +
    getProficiencyPoiints(details.blueOneProficiency) +
    getProficiencyPoiints(details.blueTwoProficiency) +
    getProficiencyPoiints(details.blueThreeProficiency);
  const redPoints =
    redTelePoints + proficiencyPoints + getCoopertitionPoints(details);
  const bluePoints =
    blueTelePoints + proficiencyPoints + getCoopertitionPoints(details);
  return [
    Math.ceil(redPoints * (1 - match.redMinPen * 0.1)),
    Math.ceil(bluePoints * (1 - match.blueMinPen * 0.1))
  ];
}

function getCoopertitionPoints(details: MatchDetails): number {
  const count =
    Number(details.redOneProficiency > 0) +
    Number(details.redTwoProficiency > 0) +
    Number(details.redThreeProficiency > 0) +
    Number(details.blueOneProficiency > 0) +
    Number(details.blueTwoProficiency > 0) +
    Number(details.blueThreeProficiency > 0);
  return count === 5 ? 5 : count === 6 ? 10 : 0;
}

function getProficiencyPoiints(proficiency: number): number {
  switch (proficiency) {
    case 0:
      return 0;
    case 1:
      return 5;
    case 2:
      return 10;
    default:
      return 0;
  }
}

function getMultiplier(alignmentStatus: number): number {
  switch (alignmentStatus) {
    case 0:
      return 1.0;
    case 1:
      return 1.2;
    case 2:
      return 1.3;
    default:
      return 1.0;
  }
}

function compareRankings(a: SeasonRanking, b: SeasonRanking): number {
  if (a.rankingScore !== b.rankingScore) {
    return b.rankingScore - a.rankingScore;
  } else if (a.highestScore !== b.highestScore) {
    return b.highestScore - a.highestScore;
  } else if (a.oxyHydroPoints !== b.oxyHydroPoints) {
    return b.oxyHydroPoints - a.oxyHydroPoints;
  } else {
    return 0;
  }
}
