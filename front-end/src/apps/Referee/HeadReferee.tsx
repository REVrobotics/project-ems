import { FC, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { useSocket } from 'src/api/SocketProvider';
import DefaultLayout from 'src/layouts/DefaultLayout';
import { loadedMatchKey } from 'src/stores/Recoil';
import { Box } from '@mui/material'
import RefereeSheet from './components/games/CarbonCapture/RefereeSheet';
import ScoreSheetSmall from './components/games/CarbonCapture/ScoreSheetSmall';

const HeadReferee: FC = () => {
  const [, setMatchKey] = useRecoilState(loadedMatchKey);
  const [socket, connected] = useSocket();

  useEffect(() => {
    socket?.on('match:prestart', onPrestart);
  }, [connected]);

  useEffect(() => {
    return () => {
      socket?.removeListener('match:prestart', onPrestart);
    };
  }, []);

  const onPrestart = (matchKey: string) => {
    setMatchKey(matchKey);
  };

  return (
    <DefaultLayout containerWidth='xl'>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '16px' }} >
            <RefereeSheet alliance='red' />
            <RefereeSheet />
        </Box>
        <ScoreSheetSmall />
      </Box>
    </DefaultLayout>
  );
};

export default HeadReferee;
