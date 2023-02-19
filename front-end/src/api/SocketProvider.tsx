import { createSocket } from '@toa-lib/client';
import {
  LED_ALLCLEAR,
  LED_FIELDFAULT,
  LED_PRESTART,
  MatchKey,
  MOTOR_DISABLE,
  MOTOR_FORWARD,
  MOTOR_REVERSE,
  setLEDLength,
  setLEDPattern
} from '@toa-lib/models';
import { Socket } from 'socket.io-client';
import { useRecoilState } from 'recoil';
import { socketConnectedAtom } from 'src/stores/Recoil';

let LEDEndgame = false;
let LEDMatchOver = false;
let socket: Socket | null = null;
let endGameSpeed: number;
let matchOverPattern: number;
let matchOverStlye: string | null;
let carbonColor = false;
let LED_COLOR1: number;
let LED_COLOR2: number;
let motorReverseDuration: number;

const COOPERTITION = 109;
const LED_BASE = 15;

export function setLEDEndgame(state: boolean) {
  LEDEndgame = state;
}
export function setLEDMatchOver(state: boolean) {
  LEDMatchOver = state;
}
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
    socket = createSocket(token);
    initEvents();
  };

  const initEvents = () => {
    if (socket) {
      socket.on('connect', () => {
        setConnected(true);
        console.log('CONNECTED');
        socket?.emit('rooms', ['match', 'fcs']);
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
    }
  };

  return [socket, connected, setupSocket];
};

/* Utility/helper functions for socket state */
export function sendPrestart(key: MatchKey): void {
  socket?.emit('match:prestart', { key });
  socket?.emit('fcs:update', LED_ALLCLEAR);
}

export function setDisplays(): void {
  socket?.emit('match:display', 2);
}

export function sendPrepareField(): void {
  socket?.emit('fcs:update', LED_PRESTART);
}

export function sendStartMatch(): void {
  socket?.emit('match:start');
  setTimeout(() => {
    socket?.emit('fcs:update', setLEDLength(calcLedFromCm(0)));
  }, 250);
  socket?.emit('fcs:update', setLEDPattern(LED_COLOR1));
}

export async function dump(duration: number) {
  return new Promise((resolve) => {
    socket?.emit('fcs:update', MOTOR_FORWARD);
    setTimeout(() => {
      socket?.emit('fcs:update', MOTOR_DISABLE);
      resolve(null);
    }, duration);
  });
}

export async function prepareField(
  duration: number,
  endGameHBSpeed: number,
  cdStyle: string,
  cdDuration: number,
  moStyle: string,
  moPattern: number,
  color1: number,
  color2: number,
  tSetupDuration: number,
  mReverseDuration: number
): Promise<void> {
  endGameSpeed = endGameHBSpeed;
  matchOverStlye = moStyle;
  matchOverPattern = moPattern;
  LED_COLOR1 = color1;
  LED_COLOR2 = color2;
  motorReverseDuration = mReverseDuration;
  setLEDEndgame(false);
  setLEDMatchOver(false);
  socket?.emit('fcs:update', setLEDPattern(LED_COLOR2));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const countdown = async () => {
    for (let i = 108; i >= 0; i = i - Math.min(108 / (cdDuration / 100))) {
      socket?.emit('fcs:update', setLEDLength(i));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const raceLight = async () => {
    for (let i = 108 - Math.min(108 / 3); i >= 0; i = i - Math.min(108 / 3)) {
      if (i == 108) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      socket?.emit('fcs:update', setLEDLength(Math.max(i, 0)));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  switch (cdStyle) {
    case 'style1':
      await countdown();
      break;
    case 'style2':
      await raceLight();
      break;
    default:
      break;
  }
  return;
}

export async function sendAbortMatch(): Promise<void> {
  socket?.emit('match:abort');
  await reverseMotors();
  setLEDEndgame(false);
  socket?.emit('fcs:update', LED_FIELDFAULT);
}
export async function reverseMotors(): Promise<void> {
  socket?.emit('fcs:update', MOTOR_REVERSE);
  setTimeout(() => {
    socket?.emit('fcs:update', MOTOR_DISABLE);
  }, motorReverseDuration);
}

/* TODO - this is game-specific */
export async function updateSink(carbonPoints: number): Promise<void> {
  const normalized = calcLedFromCm(carbonPoints);
  socket?.emit('fcs:update', setLEDLength(normalized));
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (carbonPoints >= COOPERTITION && (!carbonColor || LEDMatchOver)) {
    carbonColor = true;
    if (LEDEndgame) {
      socket?.emit('fcs:update', setLEDPattern(1600 + endGameSpeed));
    } else {
      socket?.emit('fcs:update', setLEDPattern(LED_COLOR2));
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  } else {
    if (carbonPoints < COOPERTITION && (carbonColor || LEDMatchOver)) {
      carbonColor = false;
      if (LEDEndgame) {
        socket?.emit('fcs:update', setLEDPattern(1500 + endGameSpeed));
      } else {
        socket?.emit('fcs:update', setLEDPattern(LED_COLOR1));
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

export async function endGameFlash(carbonPoints: number): Promise<void> {
  const led = calcLedFromCm(carbonPoints);
  setLEDEndgame(true);
  // socket?.emit('fcs:update', setLEDLength(led));
  // await new Promise((resolve) => setTimeout(resolve, 250));
  if (carbonPoints >= COOPERTITION) {
    socket?.emit('fcs:update', setLEDPattern(1600 + endGameSpeed));
  } else {
    socket?.emit('fcs:update', setLEDPattern(1500 + endGameSpeed));
  }
}

export async function sendAllClear(): Promise<void> {
  socket?.emit('fcs:update', LED_ALLCLEAR);
}

export async function sendCommitScores(matchKey: string): Promise<void> {
  socket?.emit('match:commit', matchKey);
  socket?.emit('fcs:update', setLEDLength(120));
  await new Promise((resolve) => setTimeout(resolve, 250));
  socket?.emit('fcs:update', LED_ALLCLEAR);
}

export function calcLedFromCm(carbon: number) {
  return Math.min(Math.floor(Math.max(carbon + LED_BASE, 0) / 1.648), 108);
}

export async function matchOver(carbonPoints: number): Promise<void> {
  const led = calcLedFromCm(carbonPoints);
  setLEDEndgame(false);
  setLEDMatchOver(true);
  switch (matchOverStlye) {
    case 'carbon':
      socket?.emit('fcs:update', setLEDLength(led));
      break;
    case 'full':
      socket?.emit('fcs:update', setLEDLength(120));
      break;
    default:
      break;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  switch (matchOverPattern) {
    case 1:
      await updateSink(carbonPoints);
      break;
    default:
      socket?.emit('fcs:update', setLEDPattern(matchOverPattern));
      break;
  }
  reverseMotors();
}
export async function sendPostResults(): Promise<void> {
  socket?.emit('match:display', 3);
}

export default socket;
