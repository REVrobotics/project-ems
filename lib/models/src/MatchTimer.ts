import { EventEmitter } from 'events';

export interface MatchConfiguration {
  delayTime: number;
  autoTime: number;
  transitionTime: number;
  teleTime: number;
  endTime: number;
}

export const FGC_MATCH_CONFIG: MatchConfiguration = {
  transitionTime: 0,
  delayTime: 0,
  autoTime: 0,
  teleTime: 150,
  endTime: 30
};

export const FRC_MATCH_CONFIG: MatchConfiguration = {
  transitionTime: 0,
  delayTime: 0,
  autoTime: 15,
  teleTime: 135,
  endTime: 30
};

export enum MatchMode {
  PRESTART = 0,
  AUTONOMOUS = 1,
  TRANSITION = 7,
  TELEOPERATED = 2,
  ENDGAME = 3,
  ENDED = 4,
  ABORTED = 5,
  RESET = 6
}

export class MatchTimer extends EventEmitter {
  private _matchConfig: MatchConfiguration;

  private _mode: MatchMode;
  private _timerID: any;
  private _timeLeft: number;
  private _modeTimeLeft: number;

  constructor() {
    super();

    this._mode = MatchMode.RESET;
    this._timerID = null;
    this._matchConfig = FGC_MATCH_CONFIG;
    this._timeLeft = getMatchTime(this._matchConfig);
    this._modeTimeLeft = this._matchConfig.delayTime;
  }

  public start() {
    if (!this.inProgress()) {
      if (this.matchConfig.delayTime > 0) {
        this._mode = MatchMode.PRESTART;
        this._modeTimeLeft = this.matchConfig.delayTime;
      } else if (this.matchConfig.autoTime > 0) {
        this._mode = MatchMode.AUTONOMOUS;
        this._modeTimeLeft = this.matchConfig.autoTime;
      } else if (this.matchConfig.transitionTime > 0) {
        this._mode = MatchMode.TRANSITION;
        this._modeTimeLeft = this.matchConfig.transitionTime;
      } else {
        this._mode = MatchMode.TELEOPERATED;
        this._modeTimeLeft = this.matchConfig.teleTime;
      }
      this._timeLeft = getMatchTime(this._matchConfig);
      this.emit('match:start', this._timeLeft);
      this._timerID = global.setInterval(() => {
        this.tick();
      }, 1000);
    }
  }

  public stop() {
    if (this.inProgress()) {
      global.clearInterval(this._timerID);
      this._timerID = null;
      this._mode = MatchMode.ENDED;
      this._timeLeft = 0;
      this.emit('match:end');
    }
  }

  public abort() {
    if (this.inProgress()) {
      global.clearInterval(this._timerID);
      this._timerID = null;
      this._mode = MatchMode.ABORTED;
      this._timeLeft = 0;
      this.emit('match:abort');
    }
  }

  public inProgress() {
    return this._timerID !== null;
  }

  public removeListeners(): void {
    this.removeAllListeners('match:start');
    this.removeAllListeners('match:auto');
    this.removeAllListeners('match:tele');
    this.removeAllListeners('match:endgame');
    this.removeAllListeners('match:end');
    this.removeAllListeners('match:abort');
  }

  private tick() {
    if (this._timeLeft === 0) {
      this.stop();
    }

    this._modeTimeLeft--;
    this._timeLeft--;

    if (this._modeTimeLeft === 0) {
      switch (this._mode) {
        case MatchMode.PRESTART:
          if (this.matchConfig.autoTime > 0) {
            this._mode = MatchMode.AUTONOMOUS;
            this._modeTimeLeft = this.matchConfig.autoTime;
            this.emit('match:auto');
          } else {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit('match:tele');
          }
          break;
        case MatchMode.AUTONOMOUS:
          if (this.matchConfig.transitionTime > 0) {
            this._mode = MatchMode.TRANSITION;
            this._modeTimeLeft = this.matchConfig.transitionTime;
            this.emit('match:transition');
          } else if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit('match:tele');
          } else {
            this.stop();
          }
          break;
        case MatchMode.TRANSITION:
          if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit('match:tele');
          } else {
            this.stop();
          }
      }
    } else {
      if (
        this.matchConfig.endTime > 0 &&
        this._timeLeft === this.matchConfig.endTime
      ) {
        this._mode = MatchMode.ENDGAME;
        this.emit('match:endgame');
      }
    }
  }

  get matchConfig(): MatchConfiguration {
    return this._matchConfig;
  }

  set matchConfig(value: MatchConfiguration) {
    this._matchConfig = value;
  }

  get timeLeft(): number {
    return this._timeLeft;
  }

  set timeLeft(value: number) {
    this._timeLeft = value;
  }

  get modeTimeLeft(): number {
    return this._modeTimeLeft;
  }

  set modeTimeLeft(value: number) {
    this._modeTimeLeft = value;
  }

  get mode(): MatchMode {
    return this._mode;
  }

  set mode(value: MatchMode) {
    this._mode = value;
  }
}

export function getMatchTime(config: MatchConfiguration): number {
  return (
    config.delayTime + config.autoTime + config.transitionTime + config.teleTime
  );
}
