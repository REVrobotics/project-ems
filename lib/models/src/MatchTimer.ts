import EventEmitter from 'events';

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
  transitionTime: 3,
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
  private _mode: MatchMode;
  private _timerID: any;

  // These three fields get initialized by the matchConfig setter, which is used in the constructor.
  private _matchConfig!: MatchConfiguration;
  private _timeLeft!: number;
  private _modeTimeLeft!: number;

  constructor() {
    super();

    this._mode = MatchMode.RESET;
    this._timerID = null;
    this.matchConfig = FRC_MATCH_CONFIG;
  }

  public start(): undefined {
    if (!this.inProgress()) {
      let matchPhaseEvent: MatchTimer.Events;
      if (this.matchConfig.delayTime > 0) {
        this._mode = MatchMode.PRESTART;
        this._modeTimeLeft = this.matchConfig.delayTime;
        matchPhaseEvent = MatchTimer.Events.PRESTART;
      } else if (this.matchConfig.autoTime > 0) {
        this._mode = MatchMode.AUTONOMOUS;
        this._modeTimeLeft = this.matchConfig.autoTime;
        matchPhaseEvent = MatchTimer.Events.AUTONOMOUS;
      } else if (this.matchConfig.transitionTime > 0) {
        this._mode = MatchMode.TRANSITION;
        this._modeTimeLeft = this.matchConfig.transitionTime;
        matchPhaseEvent = MatchTimer.Events.TRANSITION;
      } else {
        this._mode = MatchMode.TELEOPERATED;
        this._modeTimeLeft = this.matchConfig.teleTime;
        matchPhaseEvent = MatchTimer.Events.TELEOPERATED;
      }
      this._timeLeft = getMatchTime(this._matchConfig);
      this.emit(MatchTimer.Events.START, this._timeLeft);
      this.emit(matchPhaseEvent);
      this._timerID = setInterval(() => {
        this.tick();
      }, 1000);
    }
  }

  public stop(): undefined {
    if (this.inProgress()) {
      clearInterval(this._timerID);
      this._timerID = null;
      this._mode = MatchMode.ENDED;
      this._timeLeft = 0;
      this.emit(MatchTimer.Events.END);
    }
  }

  public abort(): undefined {
    if (this.inProgress()) {
      clearInterval(this._timerID);
      this._timerID = null;
      this._mode = MatchMode.ABORTED;
      this._timeLeft = 0;
      this.emit(MatchTimer.Events.ABORT);
    }
  }

  public reset(): undefined {
    if (!this.inProgress()) {
      this._mode = MatchMode.RESET;
      this._timerID = null;
      this._timeLeft = getMatchTime(this._matchConfig);
      this._modeTimeLeft = this._matchConfig.delayTime;
    }
  }

  public inProgress(): boolean {
    return this._timerID !== null;
  }

  private tick(): undefined {
    if (this._timeLeft === 0) {
      this.stop();
      return;
    }

    this._modeTimeLeft--;
    this._timeLeft--;

    if (this._modeTimeLeft === 0) {
      switch (this._mode) {
        case MatchMode.PRESTART:
          if (this.matchConfig.autoTime > 0) {
            this._mode = MatchMode.AUTONOMOUS;
            this._modeTimeLeft = this.matchConfig.autoTime;
            this.emit(MatchTimer.Events.AUTONOMOUS);
          } else {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
          }
          break;
        case MatchMode.AUTONOMOUS:
          if (this.matchConfig.transitionTime > 0) {
            this._mode = MatchMode.TRANSITION;
            this._modeTimeLeft = this.matchConfig.transitionTime;
            this.emit(MatchTimer.Events.TRANSITION);
          } else if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
          } else {
            this.stop();
          }
          break;
        case MatchMode.TRANSITION:
          if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._modeTimeLeft = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
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
        this.emit(MatchTimer.Events.ENDGAME);
      }
    }
  }

  get matchConfig(): MatchConfiguration {
    return this._matchConfig;
  }

  set matchConfig(value: MatchConfiguration) {
    if (this.inProgress()) {
      throw new Error("Do not change the match config while the match timer is active");
    }

    this._matchConfig = value;
    this._timeLeft = getMatchTime(value);
    this._modeTimeLeft = value.delayTime;
  }

  get timeLeft(): number {
    return this._timeLeft;
  }

  get modeTimeLeft(): number {
    return this._modeTimeLeft;
  }

  get mode(): MatchMode {
    return this._mode;
  }
}

export namespace MatchTimer {
  export enum Events {
    START = "start",
    PRESTART = "prestart",
    AUTONOMOUS = "auto",
    TRANSITION = "transition",
    TELEOPERATED = "tele",
    ENDGAME = "endgame",
    END = "end",
    ABORT = "abort",
  }
}

export function getMatchTime(config: MatchConfiguration): number {
  return (
    config.delayTime + config.autoTime + config.transitionTime + config.teleTime
  );
}
