import { FC, SyntheticEvent, useState } from 'react';
import { RefereeScoreSheetProps } from '@seasons/index';
import { useSocket } from 'src/api/SocketProvider';
import { SetterOrUpdater, useRecoilState } from 'recoil';
import { matchInProgressAtom } from '@stores/NewRecoil';
import {
  HydrogenHorizons,
  Match,
  MatchSocketEvent,
  ScoreItemUpdate
} from '@toa-lib/models';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import ConnectionChip from '@components/ConnectionChip/ConnectionChip';
import MatchChip from '@components/MatchChip/MatchChip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from '@components/TabPanel/TabPanel';
import TeleScoreSheet from './TeleOpScoreSheet';
import TeamSheet from './TeamSheet';
import PenaltySheet from './PenaltySheet';

const ScoreSheet: FC<RefereeScoreSheetProps> = ({ alliance }) => {
  const [socket] = useSocket();
  const [match, setMatch]: [
    Match<HydrogenHorizons.MatchDetails> | null,
    SetterOrUpdater<Match<HydrogenHorizons.MatchDetails> | null>
  ] = useRecoilState(matchInProgressAtom);

  const [tabIndex, setTabIndex] = useState(0);

  const participants = match?.participants?.filter((p) =>
    alliance === 'red' ? p.station < 20 : p.station >= 20
  );

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleMatchUpdate = (
    newMatch: Match<HydrogenHorizons.MatchDetails>
  ) => {
    socket?.emit(MatchSocketEvent.UPDATE, newMatch);
  };

  const handleMatchDetailsUpdate = <
    K extends keyof HydrogenHorizons.MatchDetails
  >(
    detailsKey: K,
    value: HydrogenHorizons.MatchDetails[K]
  ) => {
    const update: ScoreItemUpdate = { detailsKey: detailsKey, value };
    socket?.emit(MatchSocketEvent.SCORE_ITEM_UPDATE, update);

    // Reduce UI latency by updating our local match state in anticipation
    // of the update that the server wil send soon
    if (match && match.details) {
      const details = Object.assign(
        {},
        { ...match.details, [detailsKey]: value }
      );
      const newMatch = Object.assign({}, { ...match, details });
      setMatch(newMatch);
    }
  };

  return (
    <Paper
      sx={{
        padding: (theme) => theme.spacing(2),
        borderStyle: 'solid',
        borderWidth: 'thick',
        borderColor: alliance === 'red' ? '#de1f1f' : '#1f85de',
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography variant='h5' sx={{ textAlign: 'center' }}>
          {alliance === 'red' ? 'Red' : 'Blue'} Alliance
        </Typography>
        <Box className='center'>
          <ConnectionChip />
          <MatchChip match={match} />
        </Box>
        <Tabs value={tabIndex} onChange={handleChange} variant='fullWidth'>
          <Tab label='TeleOp' />
          <Tab label='Cards/Fouls' />
        </Tabs>
        <TabPanel value={tabIndex} index={0}>
          <TeleScoreSheet
            alliance={alliance}
            participants={participants}
            onMatchDetailsUpdate={handleMatchDetailsUpdate}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          {participants?.map((p) => (
            <TeamSheet
              key={`${p.eventKey}-${p.tournamentKey}-${p.station}`}
              station={p.station}
            />
          ))}
          <PenaltySheet alliance='red' onUpdate={handleMatchUpdate} />
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default ScoreSheet;
