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
  private startTimeMonotonicMs: number;
  private _mode: MatchMode;
  private timerID: any;

  // These fields get initialized by the matchConfig setter, which is used in the constructor.
  private _matchConfig!: MatchConfiguration;
  private _matchLengthSeconds!: number;
  private _secondsLeftInMatch!: number;
  private _secondsLeftInMode!: number;

  constructor() {
    super();

    this.startTimeMonotonicMs = 0;
    this._mode = MatchMode.RESET;
    this.timerID = null;
    this.matchConfig = FRC_MATCH_CONFIG;
  }

  public start(): undefined {
    if (!this.inProgress()) {
      this.startTimeMonotonicMs = performance.now();
      let matchPhaseEvent: MatchTimer.Events;
      if (this.matchConfig.delayTime > 0) {
        this._mode = MatchMode.PRESTART;
        this._secondsLeftInMode = this.matchConfig.delayTime;
        matchPhaseEvent = MatchTimer.Events.PRESTART;
      } else if (this.matchConfig.autoTime > 0) {
        this._mode = MatchMode.AUTONOMOUS;
        this._secondsLeftInMode = this.matchConfig.autoTime;
        matchPhaseEvent = MatchTimer.Events.AUTONOMOUS;
      } else if (this.matchConfig.transitionTime > 0) {
        this._mode = MatchMode.TRANSITION;
        this._secondsLeftInMode = this.matchConfig.transitionTime;
        matchPhaseEvent = MatchTimer.Events.TRANSITION;
      } else {
        this._mode = MatchMode.TELEOPERATED;
        this._secondsLeftInMode = this.matchConfig.teleTime;
        matchPhaseEvent = MatchTimer.Events.TELEOPERATED;
      }
      this._secondsLeftInMatch = this.matchLength;
      this.emit(MatchTimer.Events.START, this.secondsLeftInMatch);
      this.emit(matchPhaseEvent);
      this.timerID = setInterval(() => this.checkStatus(), 50);
    }
  }

  public stop(): undefined {
    if (this.inProgress()) {
      clearInterval(this.timerID);
      this.timerID = null;
      this._mode = MatchMode.ENDED;
      this._secondsLeftInMatch = 0;
      this.emit(MatchTimer.Events.END);
    }
  }

  public abort(): undefined {
    if (this.inProgress()) {
      clearInterval(this.timerID);
      this.timerID = null;
      this._mode = MatchMode.ABORTED;
      this._secondsLeftInMatch = 0;
      this.emit(MatchTimer.Events.ABORT);
    }
  }

  public reset(): undefined {
    if (!this.inProgress()) {
      this._mode = MatchMode.RESET;
      this.timerID = null;
      this._secondsLeftInMatch = this.matchLength;
      this._secondsLeftInMode = this.matchConfig.delayTime;
    }
  }

  public inProgress(): boolean {
    return this.timerID !== null;
  }

  private checkStatus(): undefined {
    const msSinceStart = performance.now() - this.startTimeMonotonicMs;
    const wholeSecondsSinceStart = Math.floor(msSinceStart * 0.001);
    if (this.matchLength - wholeSecondsSinceStart < this.secondsLeftInMatch) {
      this.tick();
    }
  }

  private tick(): undefined {
    if (this.secondsLeftInMatch === 0) {
      this.stop();
      return;
    }

    this._secondsLeftInMode--;
    this._secondsLeftInMatch--;

    if (this.secondsLeftInMode === 0) {
      switch (this.mode) {
        case MatchMode.PRESTART:
          if (this.matchConfig.autoTime > 0) {
            this._mode = MatchMode.AUTONOMOUS;
            this._secondsLeftInMode = this.matchConfig.autoTime;
            this.emit(MatchTimer.Events.AUTONOMOUS);
          } else {
            this._mode = MatchMode.TELEOPERATED;
            this._secondsLeftInMode = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
          }
          break;
        case MatchMode.AUTONOMOUS:
          if (this.matchConfig.transitionTime > 0) {
            this._mode = MatchMode.TRANSITION;
            this._secondsLeftInMode = this.matchConfig.transitionTime;
            this.emit(MatchTimer.Events.TRANSITION);
          } else if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._secondsLeftInMode = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
          } else {
            this.stop();
          }
          break;
        case MatchMode.TRANSITION:
          if (this.matchConfig.teleTime > 0) {
            this._mode = MatchMode.TELEOPERATED;
            this._secondsLeftInMode = this.matchConfig.teleTime;
            this.emit(MatchTimer.Events.TELEOPERATED);
          } else {
            this.stop();
          }
      }
    } else {
      if (
        this.matchConfig.endTime > 0 &&
        this.secondsLeftInMatch === this.matchConfig.endTime
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
    this._matchLengthSeconds = value.delayTime + value.autoTime + value.transitionTime + value.teleTime;
    this._secondsLeftInMatch = this.matchLength;
    this._secondsLeftInMode = value.delayTime;
  }

  get matchLength(): number {
    return this._matchLengthSeconds;
  }

  get secondsLeftInMatch(): number {
    return this._secondsLeftInMatch;
  }

  get secondsLeftInMode(): number {
    return this._secondsLeftInMode;
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
