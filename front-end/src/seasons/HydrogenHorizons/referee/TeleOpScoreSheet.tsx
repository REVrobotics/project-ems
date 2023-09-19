import { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {
  Alliance,
  HydrogenHorizons,
  Match,
  MatchParticipant
} from '@toa-lib/models';
import StateToggle from '@components/Referee/StateToggle';
import { useRecoilValue } from 'recoil';
import { matchInProgressAtom } from '@stores/NewRecoil';
import NumberInput from '@components/Referee/NumberInput';
import {
  AlignmentStatus,
  Proficiency
} from '@toa-lib/models/build/seasons/HydrogenHorizons';
import { useTeamIdentifiers } from 'src/hooks/use-team-identifier';

interface Props {
  alliance: Alliance;
  participants: MatchParticipant[] | undefined;
  onMatchDetailsUpdate?: <K extends keyof HydrogenHorizons.MatchDetails>(
    detailsKey: K,
    value: HydrogenHorizons.MatchDetails[K]
  ) => void;
}

const TeleScoreSheet: FC<Props> = ({
  alliance,
  participants,
  onMatchDetailsUpdate
}) => {
  const match: Match<HydrogenHorizons.MatchDetails> | null =
    useRecoilValue(matchInProgressAtom);
  const identifiers = useTeamIdentifiers();

  if (!match || !match.details) return null;

  const handleOxygenChange = (newValue: number) => {
    // TODO(Noah): Re-introduce updating local match state to reduce UI latency
    if (onMatchDetailsUpdate) {
      onMatchDetailsUpdate(
        alliance === 'red' ? 'redOxygenPoints' : 'blueOxygenPoints',
        newValue
      );
    }
  };

  const handleHydrogenChange = (newValue: number) => {
    if (onMatchDetailsUpdate) {
      onMatchDetailsUpdate(
        alliance === 'red' ? 'redHydrogenPoints' : 'blueHydrogenPoints',
        newValue
      );
    }
  };

  const handleAlignmentUpdate = (newValue: AlignmentStatus) => {
    if (onMatchDetailsUpdate) {
      onMatchDetailsUpdate(
        alliance === 'red' ? 'redAlignment' : 'blueAlignment',
        newValue
      );
    }
  };

  const getProficiencyStatus = (station: number): Proficiency | undefined => {
    switch (station) {
      case 11:
        return match.details?.redOneProficiency;
      case 12:
        return match.details?.redTwoProficiency;
      case 13:
        return match.details?.redThreeProficiency;
      case 21:
        return match.details?.blueOneProficiency;
      case 22:
        return match.details?.blueTwoProficiency;
      case 23:
        return match.details?.blueThreeProficiency;
      default:
        return Proficiency.DEVELOPING;
    }
  };

  const updateProficiency = (station: number, value: Proficiency) => {
    if (!onMatchDetailsUpdate) {
      return;
    }
    switch (station) {
      case 11:
        onMatchDetailsUpdate('redOneProficiency', value);
        break;
      case 12:
        onMatchDetailsUpdate('redTwoProficiency', value);
        break;
      case 13:
        onMatchDetailsUpdate('redThreeProficiency', value);
        break;
      case 21:
        onMatchDetailsUpdate('blueOneProficiency', value);
        break;
      case 22:
        onMatchDetailsUpdate('blueTwoProficiency', value);
        break;
      case 23:
        onMatchDetailsUpdate('blueThreeProficiency', value);
        break;
    }
  };

  console.log({ match });
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6} lg={6}>
        <Typography variant='h6' textAlign='center'>
          Oxygen Points
        </Typography>
        <NumberInput
          value={
            alliance === 'red'
              ? match.details.redOxygenPoints
              : match.details.blueOxygenPoints
          }
          onChange={handleOxygenChange}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={6}>
        <Typography variant='h6' textAlign='center'>
          Hydrogen Points
        </Typography>
        <NumberInput
          value={
            alliance === 'red'
              ? match.details.redHydrogenPoints
              : match.details.blueHydrogenPoints
          }
          onChange={handleHydrogenChange}
        />
      </Grid>
      <Grid item xs={12} md={4} lg={4}>
        {/* The states attribute MUST match the order of the AlignmentStatus enum */}
        <StateToggle
          title={`Alignment`}
          states={['No Alignment', 'Partial Alignment', 'Full Alignment']}
          value={
            alliance === 'red'
              ? match.details.redAlignment
              : match.details.blueAlignment
          }
          onChange={handleAlignmentUpdate}
          fullWidth
        />
      </Grid>
      {participants?.map((p) => {
        const update = (value: Proficiency) => {
          updateProficiency(p.station, value);
        };

        return (
          <Grid item key={`${p.teamKey}-proficiency`} xs={12} md={3} lg={3}>
            {/* The states attribute MUST match the order of the Proficiency enum */}
            <StateToggle
              title={`${identifiers[p.teamKey]} Proficiency`}
              states={['Developing', 'Intermediate', 'Expert']}
              value={getProficiencyStatus(p.station) ?? Proficiency.DEVELOPING}
              onChange={update}
              fullWidth
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TeleScoreSheet;
