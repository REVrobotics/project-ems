import { createSocket } from '@toa-lib/client';
import {
  FCS_ALL_CLEAR,
  FCS_PREPARE_FIELD,
  MatchKey,
  MatchSocketEvent,
  TimerInitializationData,
  TimerTruthListener
} from '@toa-lib/models';
import { Socket } from 'socket.io-client';
import { useRecoilState } from 'recoil';
import { socketConnectedAtom } from 'src/stores/NewRecoil';

let socket: Socket | null = null;

export function destroySocket() {
  socket?.off('connect');
  socket?.off('disconnect');
  socket?.disconnect();
  console.log('client disconnected');
  socket = null;
}

export const useSocket = (): [
  Socket | null,
  boolean,
  (token: string) => void
] => {
  const [connected, setConnected] = useRecoilState(socketConnectedAtom);

  const setupSocket = (token: string) => {
    if (socket) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    /* @ts-ignore */
    socket = createSocket(token);
    initEvents();
  };

  const initEvents = () => {
    if (socket) {
      socket.on('connect', () => {
        setConnected(true);
        console.log('CONNECTED');
        socket?.emit('rooms', ['match', 'fcs', 'frc-fms']);
      });
      socket.on('disconnect', (reason) => {
        console.log('DISCONNECT', reason);
        setConnected(false);
      });
      socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err}`);
      });
      socket.on('error', (err) => {
        console.error(err);
        if (err.description) throw err.description;
        else throw err;
      });

      // Timer events
      socket.on(MatchSocketEvent.INIT_TIMER, timerEventHandlers.init);
      socket?.on(MatchSocketEvent.START, timerEventHandlers.start);
      socket?.on(MatchSocketEvent.ABORT, timerEventHandlers.abort);
      socket?.on(MatchSocketEvent.RESET_TIMER, timerEventHandlers.reset);
      socket?.on(
        MatchSocketEvent.SECONDS_REMAINING,
        timerEventHandlers.secondsRemaining
      );
    }
  };

  return [socket, connected, setupSocket];
};

/* Utility/helper functions for socket state */
export function sendPrestart(key: MatchKey): void {
  socket?.emit(MatchSocketEvent.PRESTART, key);
}

export function setDisplays(): void {
  socket?.emit(MatchSocketEvent.DISPLAY, 2);
}

export function sendPrepareField(): void {
  socket?.emit('fcs:update', FCS_PREPARE_FIELD);
}

export function sendStartMatch(): void {
  socket?.emit(MatchSocketEvent.START);
}

export async function sendAbortMatch(): Promise<void> {
  socket?.emit(MatchSocketEvent.ABORT);
}

export async function sendAllClear(): Promise<void> {
  socket?.emit('fcs:update', FCS_ALL_CLEAR);
}

export async function sendCommitScores(key: MatchKey): Promise<void> {
  socket?.emit(MatchSocketEvent.COMMIT, key);
}

export async function sendPostResults(): Promise<void> {
  socket?.emit(MatchSocketEvent.DISPLAY, 3);
}

export async function sendUpdateFrcFmsSettings(
  hwFingerprint: string
): Promise<void> {
  socket?.emit('frc-fms:settings-update', { hwFingerprint });
}

const timerEventHandlers = {
  init: (initData: TimerInitializationData) => undefined,
  start: () => undefined,
  abort: () => undefined,
  reset: () => undefined,
  secondsRemaining: (secondsLeft: number) => undefined
};

export const timerTruthListener: TimerTruthListener = {
  requestInitialization(): undefined {
    socket?.emit(MatchSocketEvent.REQUEST_TIMER_INIT);
  },
  onInitialization(
    handler: (initData: TimerInitializationData) => undefined
  ): undefined {
    timerEventHandlers.init = handler;
  },
  onStart(handler: () => undefined): undefined {
    timerEventHandlers.start = handler;
  },
  onAbort(handler: () => undefined): undefined {
    timerEventHandlers.abort = handler;
  },
  onReset(handler: () => undefined): undefined {
    timerEventHandlers.reset = handler;
  },
  onSecondsLeftInMatchUpdate(
    handler: (secondsLeftInMatch: number) => undefined
  ): undefined {
    timerEventHandlers.secondsRemaining = handler;
  }
};

export default socket;
