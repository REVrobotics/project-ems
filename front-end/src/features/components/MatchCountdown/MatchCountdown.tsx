import {
  MatchSocketEvent,
  MatchTimer,
  TimerEventPayload
} from '@toa-lib/models';
import { Duration } from 'luxon';
import { FC, useEffect } from 'react';
import { useRecoilState } from 'recoil';
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
import { matchTimeAtom, matchTimeModeAtom, timer } from 'src/stores/NewRecoil';

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
  const [time, setTime] = useRecoilState(matchTimeAtom);
  const [modeTime, setModeTime] = useRecoilState(matchTimeModeAtom);
  const [socket, connected] = useSocket();

  useEffect(() => {
    if (connected) {
      socket?.on(MatchSocketEvent.PRESTART, onPrestart);
      socket?.on(MatchSocketEvent.START, onStart);
      socket?.on(MatchSocketEvent.ABORT, onAbort);

      timer.on(MatchTimer.Events.TRANSITION, onTransition);
      timer.on(MatchTimer.Events.TELEOPERATED, onTele);
      timer.on(MatchTimer.Events.ENDGAME, onEndgame);
      timer.on(MatchTimer.Events.END, onEnd);
    }
  }, [connected]);

  useEffect(() => {
    setTime(timer.secondsLeftInMatch);
    setModeTime(timer.secondsLeftInMode);

    const tick = setInterval(() => {
      setTime(timer.secondsLeftInMatch);
      setModeTime(timer.secondsLeftInMode);
    }, 150);

    return () => {
      socket?.off(MatchSocketEvent.PRESTART, onPrestart);
      socket?.off(MatchSocketEvent.START, onStart);
      socket?.off(MatchSocketEvent.ABORT, onAbort);

      timer.off(MatchTimer.Events.TRANSITION, onTransition);
      timer.off(MatchTimer.Events.TELEOPERATED, onTele);
      timer.off(MatchTimer.Events.ENDGAME, onEndgame);
      timer.off(MatchTimer.Events.END, onEnd);
      clearInterval(tick);
    };
  }, []);

  const timeDuration = Duration.fromObject({
    seconds: mode === 'timeLeft' ? time : modeTime
  });

  const onPrestart = () => {
    setTime(timer.secondsLeftInMatch);
  };
  const onStart = () => {
    if (audio) startAudio.play();
  };
  const onTransition = (payload: TimerEventPayload) => {
    if (audio && !payload.initializing) transitionAudio.play();
  };
  const onTele = (payload: TimerEventPayload) => {
    if (audio && !payload.initializing) teleAudio.play();
  };
  const onAbort = () => {
    if (audio) abortAudio.play();
  };
  const onEnd = (payload: TimerEventPayload) => {
    if (audio && !payload.initializing) endAudio.play();
  };
  const onEndgame = (payload: TimerEventPayload) => {
    if (audio && !payload.initializing) endgameAudio.play();
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
