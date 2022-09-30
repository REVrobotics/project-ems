import { FC, useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useRecoilState, useRecoilValue } from 'recoil';
import { matchInProgress, matchStateAtom } from 'src/stores/Recoil';
import { CarbonCaptureDetails, Match, MatchState } from '@toa-lib/models';
import { useSocket } from 'src/api/SocketProvider';
import NumberInput from '../../NumberInput';

const ScoreSheetSmall: FC<{ headRef?: boolean }> = ({ headRef }) => {
  const [match, setMatch] = useRecoilState(matchInProgress);
  const [socket, connected] = useSocket();
  const matchState = useRecoilValue(matchStateAtom); // TODO(jan): fix this

  useEffect(() => {
    if (connected) {
      socket?.on('match:update', onUpdate);
    }
  }, [connected]);

  useEffect(() => {
    return () => {
      socket?.removeListener('match:update', onUpdate);
    };
  }, []);

  const onUpdate = (newMatch: Match) => {
    setMatch(newMatch);
  };

  const updateScore = (newScore: number) => {
    if (match && match.details) {
      const newMatch = {
        ...match,
        details: { ...match.details, carbonPoints: newScore }
      };
      socket?.emit('match:update', newMatch);
      setMatch(newMatch);
    }
  };

  return (
    <Paper sx={{ padding: (theme) => theme.spacing(2) }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center'
        }}
      >
        <Typography variant='h6'>Carbon Level</Typography>
        <NumberInput
          value={(match?.details as CarbonCaptureDetails)?.carbonPoints || 0}
          onChange={updateScore}
          disabled={headRef && matchState != MatchState.MATCH_COMPLETE}
        />
      </Box>
    </Paper>
  );
};

export default ScoreSheetSmall;
