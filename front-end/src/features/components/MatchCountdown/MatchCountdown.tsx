import { MatchState, MatchTimer } from '@toa-lib/models';
import { Duration } from 'luxon';
import { FC, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useSocket } from 'src/api/SocketProvider';
import {
  initAudio,
  MATCH_START,
  MATCH_TELE,
  MATCH_TRANSITION,
  MATCH_ABORT,
  MATCH_ENDGAME,
  MATCH_END
} from 'src/apps/AudienceDisplay/Audio';
import {
  matchStateAtom,
  matchTimeAtom,
  matchTimeModeAtom,
  timer
} from 'src/stores/NewRecoil';

const startAudio = initAudio(MATCH_START);
const transitionAudio = initAudio(MATCH_TRANSITION);
const teleAudio = initAudio(MATCH_TELE);
const abortAudio = initAudio(MATCH_ABORT);
const endgameAudio = initAudio(MATCH_ENDGAME);
const endAudio = initAudio(MATCH_END);

interface Props {
  audio?: boolean;
  mode?: 'modeTime' | 'timeLeft';
}

const MatchCountdown: FC<Props> = ({ audio, mode = 'timeLeft' }) => {
  const matchState = useRecoilValue(matchStateAtom);
  const [time, setTime] = useRecoilState(matchTimeAtom);
  const [modeTime, setModeTime] = useRecoilState(matchTimeModeAtom);
  const [socket, connected] = useSocket();

  useEffect(() => {
    if (connected) {
      socket?.on('match:prestart', onPrestart);
      socket?.on('match:start', onStart);
      socket?.on('match:abort', onAbort);

      timer.on(MatchTimer.Events.TRANSITION, onTransition);
      timer.on(MatchTimer.Events.TELEOPERATED, onTele);
      timer.on(MatchTimer.Events.ENDGAME, onEndgame);
      timer.on(MatchTimer.Events.END, onEnd);
    }
  }, [connected]);

  useEffect(() => {
    if (!timer.inProgress()) {
      timer.reset();
      setTime(timer.secondsLeftInMatch);
      setModeTime(timer.secondsLeftInMode);
    }

    const tick = setInterval(() => {
      setTime(timer.secondsLeftInMatch);
      setModeTime(timer.secondsLeftInMode);
    }, 500);

    return () => {
      socket?.off('match:prestart', onPrestart);
      socket?.off('match:start', onStart);
      socket?.off('match:abort', onAbort);

      timer.off(MatchTimer.Events.TRANSITION, onTransition);
      timer.off(MatchTimer.Events.TELEOPERATED, onTele);
      timer.off(MatchTimer.Events.ENDGAME, onEndgame);
      timer.off(MatchTimer.Events.END, onEnd);
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (matchState === MatchState.MATCH_IN_PROGRESS && timer.inProgress()) {
      setTime(timer.secondsLeftInMatch);
      setModeTime(timer.secondsLeftInMode);
    }
  }, [matchState]);

  const timeDuration = Duration.fromObject({
    seconds: mode === 'timeLeft' ? time : modeTime
  });

  const onPrestart = () => {
    timer.reset();
    setTime(timer.secondsLeftInMatch);
  };
  const onStart = () => {
    if (audio) startAudio.play();
    timer.start();
  };
  const onTransition = () => {
    if (audio) transitionAudio.play();
  };
  const onTele = () => {
    if (audio) teleAudio.play();
  };
  const onAbort = () => {
    if (audio) abortAudio.play();
    timer.abort();
  };
  const onEnd = () => {
    if (audio) endAudio.play();
  };

  const onEndgame = () => {
    if (audio) endgameAudio.play();
  };

  return (
    <>
      {mode === 'timeLeft'
        ? timeDuration.toFormat('m:ss')
        : timeDuration.toFormat('s')}
    </>
  );
};

export default MatchCountdown;
