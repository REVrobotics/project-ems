import { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TeamCardStatus from './TeamCardStatus';
import { MatchParticipant } from '@toa-lib/models';

interface Props {
  participant: MatchParticipant;
}

const TeamStatusRow: FC<Props> = ({ participant }) => {
  return (
    <Grid container spacing={3} sx={{ padding: (theme) => theme.spacing(1) }}>
      <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography>Team {participant.teamKey}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TeamCardStatus />
      </Grid>
    </Grid>
  );
};

export default TeamStatusRow;
