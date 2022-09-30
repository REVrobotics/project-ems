import { Match, MatchDetailBase } from '../Match';
import { Ranking } from '../Ranking';
import { isNonNullObject, isNumber } from '../types';

export interface CarbonCaptureDetails extends MatchDetailBase {
  carbonPoints: number;
  redRobotOneStorage: number;
  redRobotTwoStorage: number;
  redRobotThreeStorage: number;
  blueRobotOneStorage: number;
  blueRobotTwoStorage: number;
  blueRobotThreeStorage: number;
  coopertitionBonusLevel: number;
}

export const defaultCarbonCaptureDetails: CarbonCaptureDetails = {
  matchKey: '',
  matchDetailKey: '',
  carbonPoints: 0,
  redRobotOneStorage: 0,
  redRobotTwoStorage: 0,
  redRobotThreeStorage: 0,
  blueRobotOneStorage: 0,
  blueRobotTwoStorage: 0,
  blueRobotThreeStorage: 0,
  coopertitionBonusLevel: 0
};

export const isCarbonCaptureDetails = (
  obj: unknown
): obj is CarbonCaptureDetails =>
  isNonNullObject(obj) &&
  isNumber(obj.carbonPoints) &&
  isNumber(obj.redRobotOneStorage) &&
  isNumber(obj.redRobotTwoStorage) &&
  isNumber(obj.redRobotThreeStorage) &&
  isNumber(obj.blueRobotOneStorage) &&
  isNumber(obj.blueRobotTwoStorage) &&
  isNumber(obj.blueRobotThreeStorage) &&
  isNumber(obj.coopertitionBonusLevel);

export interface CarbonCaptureRanking extends Ranking {
  rankingScore: number;
  highestScore: number;
  carbonPoints: number;
}

export const isCarbonCaptureRanking = (
  obj: unknown
): obj is CarbonCaptureRanking =>
  isNonNullObject(obj) &&
  isNumber(obj.rankingScore) &&
  isNumber(obj.carbonPoints);

export function calculateRankings(
  matches: Match[],
  prevRankings: CarbonCaptureRanking[]
): CarbonCaptureRanking[] {
  const rankingMap: Map<number, CarbonCaptureRanking> = new Map();
  const scoresMap: Map<number, number[]> = new Map();

  // In this loop calculate basic W-L-T, as well as basic game information
  for (const match of matches) {
    if (!match.participants) break;
    for (const participant of match.participants) {
      if (!rankingMap.get(participant.teamKey)) {
        rankingMap.set(participant.teamKey, {
          allianceKey: '',
          carbonPoints: 0,
          losses: 0,
          played: 0,
          rank: 0,
          rankChange: 0,
          rankingScore: 0,
          rankKey: rankingMap.size,
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
        !isCarbonCaptureDetails(match.details) ||
        participant.disqualified === 1
      )
        continue;

      const ranking = {
        ...(rankingMap.get(participant.teamKey) as CarbonCaptureRanking)
      };
      const scores = [...(scoresMap.get(participant.teamKey) as number[])];
      const redWin = match.redScore > match.blueScore;
      const isTie = match.redScore === match.blueScore;

      if (participant.station < 20) {
        // Red Alliance
        scoresMap.set(participant.teamKey, [...scores, match.redScore]);
        ranking.wins = ranking.wins + (redWin ? 1 : 0);
        ranking.losses = ranking.losses + (redWin ? 0 : 1);
        ranking.ties = ranking.ties + (isTie ? 1 : 0);
        if (ranking.highestScore < match.redScore) {
          ranking.highestScore = match.redScore;
        }
      }

      if (participant.station >= 20) {
        // Blue Alliance
        scoresMap.set(participant.teamKey, [...scores, match.blueScore]);
        ranking.wins = ranking.wins + (redWin ? 0 : 1);
        ranking.losses = ranking.losses + (redWin ? 1 : 0);
        ranking.ties = ranking.ties + (isTie ? 1 : 0);
        if (ranking.highestScore < match.blueScore) {
          ranking.highestScore = match.blueScore;
        }
      }

      if (participant.disqualified === 1) continue;
      ranking.played = ranking.played + 1;
      ranking.carbonPoints = ranking.carbonPoints + match.details.carbonPoints;
      scoresMap.set(participant.teamKey, scores);
      rankingMap.set(participant.teamKey, ranking);
    }
  }

  // In this loop, calculate ranking score
  for (const key of rankingMap.keys()) {
    const scores = scoresMap.get(key) as number[];
    const ranking = {
      ...rankingMap.get(key)
    } as CarbonCaptureRanking;
    const lowestScore = Math.min(...scores);
    const index = scores.findIndex((s) => s === lowestScore);
    const newScores = [...scores.splice(0, index), ...scores.splice(index + 1)];
    ranking.rankingScore =
      newScores.reduce((prev, curr) => prev + curr) / newScores.length;
    rankingMap.set(key, ranking);
  }

  // In this loop calculate a team's rank
  const rankings = [...rankingMap.values()];

  // In this loop calculate the rank change

  return Array.from(rankingMap.values());
}

export function calculateScore(
  details: CarbonCaptureDetails
): [number, number] {
  const coopertition = details.coopertitionBonusLevel * 100;
  const redScore =
    (1 +
      getMultiplier(details.redRobotOneStorage) +
      getMultiplier(details.redRobotTwoStorage) +
      getMultiplier(details.redRobotThreeStorage)) *
      details.carbonPoints +
    coopertition;
  const blueScore =
    (1 +
      getMultiplier(details.blueRobotOneStorage) +
      getMultiplier(details.blueRobotTwoStorage) +
      getMultiplier(details.blueRobotThreeStorage)) *
      details.carbonPoints +
    coopertition;
  return [Math.ceil(redScore), Math.ceil(blueScore)];
}

function getMultiplier(robotStatus: number): number {
  switch (robotStatus) {
    case 0:
      return 0;
    case 1:
      return 0.25;
    case 2:
      return 0.5;
    case 3:
      return 0.75;
    case 4:
      return 1.0;
    default:
      return 0;
  }
}
