import {
  defaultCarbonCaptureDetails,
  isCarbonCaptureDetails,
  Match,
  MatchParticipant
} from '@toa-lib/models';
import { FC, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import MatchCountdown from 'src/features/components/MatchCountdown/MatchCountdown';
import { matchInProgress, timer } from 'src/stores/Recoil';
import './MatchPlay.less';
import { useSocket } from 'src/api/SocketProvider';
import {
  initAudio,
  MATCH_ABORT,
  MATCH_END,
  MATCH_ENDGAME,
  MATCH_START,
  MATCH_TELE
} from 'src/apps/AudienceDisplay/Audio';

import FGC_LOGO from '../res/Global_Logo.png';
import STORAGE_0_ICON from '../res/Storage_Level_0.png';
import STORAGE_1_ICON from '../res/Storage_Level_1.png';
import STORAGE_2_ICON from '../res/Storage_Level_2.png';
import STORAGE_3_ICON from '../res/Storage_Level_3.png';
import STORAGE_4_ICON from '../res/Storage_Level_4.png';

const startAudio = initAudio(MATCH_START);
const teleAudio = initAudio(MATCH_TELE);
const abortAudio = initAudio(MATCH_ABORT);
const endgameAudio = initAudio(MATCH_ENDGAME);
const endAudio = initAudio(MATCH_END);

const RedParticipant: FC<{ participant: MatchParticipant; level: number }> = ({
  participant,
  level
}) => {
  return (
    <div className='team'>
      <StorageStatus level={level} />
      <div className='team-name-left-p'>
        <span>{participant.team?.country}</span>
      </div>
      <div className='team-flag'>
        <span
          className={
            'flag-icon flag-icon-' + participant.team?.countryCode.toLowerCase()
          }
        />
      </div>
    </div>
  );
};

const BlueParticipant: FC<{ participant: MatchParticipant; level: number }> = ({
  participant,
  level
}) => {
  return (
    <div className='team'>
      <div className='team-flag'>
        <span
          className={
            'flag-icon flag-icon-' +
            participant?.team?.countryCode.toLocaleLowerCase()
          }
        />
      </div>
      <div className='team-name-right-p'>
        <span>{participant.team?.country}</span>
      </div>
      <StorageStatus level={level} />
    </div>
  );
};

const StorageStatus: FC<{ level: number }> = ({ level }) => {
  const getImg = () => {
    switch (level) {
      case 1:
        return STORAGE_1_ICON;
      case 2:
        return STORAGE_2_ICON;
      case 3:
        return STORAGE_3_ICON;
      case 4:
        return STORAGE_4_ICON;
      default:
        return STORAGE_0_ICON;
    }
  };

  return <img src={getImg()} className='fit-h' />;
};

const MatchPlay: FC = () => {
  const [match, setMatch] = useRecoilState(matchInProgress);
  const [socket, connected] = useSocket();
  const someDetails = match?.details;

  const redAlliance = match?.participants?.filter((p) => p.station < 20);
  const blueAlliance = match?.participants?.filter((p) => p.station >= 20);

  const name = match?.matchName ? match.matchName.split(' ')[2] : '';

  const details = isCarbonCaptureDetails(someDetails)
    ? someDetails
    : defaultCarbonCaptureDetails;
  const redStorage = [
    details.redRobotOneStorage,
    details.redRobotTwoStorage,
    details.redRobotTwoStorage
  ];
  const blueStorage = [
    details.blueRobotOneStorage,
    details.blueRobotTwoStorage,
    details.blueRobotThreeStorage
  ];

  useEffect(() => {
    if (connected) {
      socket?.on('match:start', matchStart);
      socket?.on('match:tele', matchTele);
      socket?.on('match:abort', matchAbort);
      socket?.on('match:endgame', matchEndGame);
      socket?.on('match:end', matchEnd);
      socket?.on('match:update', matchUpdate);
    }
  }, [connected]);

  useEffect(() => {
    return () => {
      socket?.removeListener('match:start', matchStart);
      socket?.removeListener('match:tele', matchTele);
      socket?.removeListener('match:abort', matchAbort);
      socket?.removeListener('match:endgame', matchEndGame);
      socket?.removeListener('match:end', matchEnd);
      socket?.removeListener('match:update', matchUpdate);
    };
  }, []);

  const matchStart = () => {
    startAudio.play();
  };

  const matchTele = () => {
    teleAudio.play();
  };

  const matchAbort = () => {
    abortAudio.play();
  };

  const matchEndGame = () => {
    endgameAudio.play();
  };

  const matchEnd = () => {
    endAudio.play();
  };

  const matchUpdate = (newMatch: Match) => {
    if (timer.inProgress()) {
      setMatch(newMatch);
    }
  };

  return (
    <div>
      <div id='play-display-base'>
        <div id='play-display-base-top'>
          <div id='play-display-left-score'>
            <div className='teams red-bg left-score'>
              {redAlliance?.map((p, i) => (
                <RedParticipant
                  key={p.matchParticipantKey}
                  participant={p}
                  level={redStorage[i]}
                />
              ))}
            </div>
          </div>
          <div id='play-display-center'>
            <div id='score-container-header'>
              <img alt={'fgc logo'} src={FGC_LOGO} className='fit-w' />
            </div>
            <div id='score-container-timer'>
              <span>
                <MatchCountdown />
              </span>
            </div>
            <div id='score-container-scores'>
              <div id='score-container-red'>
                <div className='red-bg center'>
                  <span>{match?.redScore || 0}</span>
                </div>
              </div>
              <div id='score-container-sink'>
                <div id='score-container-sink-fill' />
                <div
                  id='score-container-sink-complete'
                  style={{ top: `${(1 - details.carbonPoints / 165) * 100}%` }}
                  className={
                    details.coopertitionBonusLevel > 0 ? 'coopertition' : ''
                  }
                />
              </div>
              <div id='score-container-blue'>
                <div className='blue-bg center'>
                  <span>{match?.blueScore || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div id='play-display-right-score'>
            <div className='teams blue-bg right-score'>
              {blueAlliance?.map((p, i) => (
                <BlueParticipant
                  key={p.matchParticipantKey}
                  participant={p}
                  level={blueStorage[i]}
                />
              ))}
            </div>
          </div>
        </div>
        <div id='play-display-base-bottom'>
          <div className='info-col'>
            <span className='info-field'>MATCH: {name}</span>
          </div>
          <div className='info-col'>
            <span className='info-field'>FIRST Global 2022</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPlay;
