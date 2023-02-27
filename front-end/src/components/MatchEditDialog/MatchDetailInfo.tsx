import { FC, ChangeEvent } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useRecoilState } from 'recoil';
import { matchByCurrentIdSelectorFam } from 'src/stores/NewRecoil';
import {
  defaultCarbonCaptureDetails,
  getFunctionsBySeasonKey,
  getSeasonKeyFromEventKey,
  isCarbonCaptureDetails
} from '@toa-lib/models';

interface Props {
  id: number;
}

const MatchDetailInfo: FC<Props> = ({ id }) => {
  const [match, setMatch] = useRecoilState(matchByCurrentIdSelectorFam(id));

  // TODO - Get rid of this.
  const someDetails = match?.details;
  const isValidDetail = isCarbonCaptureDetails(someDetails);
  const details = isValidDetail ? someDetails : defaultCarbonCaptureDetails;

  const handleUpdates = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name, type } = e.target;
    if (!match) return;
    const typedValue = type === 'number' ? parseInt(value) : value;
    const details = {
      ...match.details,
      [name]: typedValue
    };
    const seasonKey = getSeasonKeyFromEventKey(match.eventKey);
    const functions = getFunctionsBySeasonKey(seasonKey);
    if (!functions) return;
    const [redScore, blueScore] = functions.calculateScore(match);
    if (match) {
      setMatch({ ...match, details, redScore, blueScore });
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={6}>
        <TextField
          label='Tournament ID'
          value={match?.tournamentKey}
          disabled
          fullWidth
          name='matchKey'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <TextField
          label='Match ID'
          value={match?.id}
          disabled
          fullWidth
          name='matchDetailKey'
        />
      </Grid>
      {/* TODO - Come up with dynamic way to change this. */}
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Carbon Points'
          value={details.carbonPoints}
          type='number'
          fullWidth
          name='carbonPoints'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Field Number'
          value={details.coopertitionBonusLevel}
          type='number'
          fullWidth
          name='coopertitionBonusLevel'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Red 1 Storage'
          value={details.redRobotOneStorage}
          type='number'
          fullWidth
          name='redRobotOneStorage'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Red 2 Storage'
          value={details.redRobotTwoStorage}
          type='number'
          fullWidth
          name='redRobotTwoStorage'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Red 3 Storage'
          value={details.redRobotThreeStorage}
          type='number'
          fullWidth
          name='redRobotThreeStorage'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Blue 1 Storage'
          value={details.blueRobotOneStorage}
          type='number'
          fullWidth
          name='blueRobotOneStorage'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Blue 2 Storage'
          value={details.blueRobotTwoStorage}
          type='number'
          fullWidth
          name='blueRobotTwoStorage'
          onChange={handleUpdates}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label='Blue 3 Storage'
          value={details.blueRobotThreeStorage}
          type='number'
          fullWidth
          name='blueRobotThreeStorage'
          onChange={handleUpdates}
        />
      </Grid>
    </Grid>
  );
};

export default MatchDetailInfo;
