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
  TRANSITION = 2,
  TELEOPERATED = 3,
  ENDGAME = 4,
  // Numbers >= MatchMode.ENDED indicate that the match is not in progress
  ENDED = 5,
  ABORTED = 6,
  RESET = 7
}

export function matchInProgress(matchMode: MatchMode): boolean {
  return matchMode < MatchMode.ENDED;
}

export interface TimerInitializationData {
  matchConfig: MatchConfiguration;
  matchMode: MatchMode;
  secondsLeftInMatch: number;
}

export interface TimerTruthBroadcaster {
  setInitializationDataProvider(provider: () => TimerInitializationData): undefined;
  broadcastInitializationData(initializationData: TimerInitializationData): undefined;
  broadcastStart(): undefined;
  broadcastAbort(): undefined;
  broadcastReset(): undefined;
  broadcastSecondsLeftInMatch(secondsLeftInMatch: number): undefined;
}

export interface TimerTruthListener {
  requestInitialization(): undefined;
  onInitialization(handler: (initData: TimerInitializationData) => undefined): undefined;
  onStart(handler: () => undefined): undefined;
  onAbort(handler: () => undefined): undefined;
  onReset(handler: () => undefined): undefined;
  onSecondsLeftInMatchUpdate(handler: (secondsLeftInMatch: number) => undefined): undefined;
}

export class MatchTimer extends EventEmitter {
  private startTimeMonotonicMs: number;
  private _mode: MatchMode;
  private timerID: any;
  private truthBroadcaster: TimerTruthBroadcaster | undefined;
  private readonly initializationDataProvider: (() => TimerInitializationData) | undefined;
  private truthListener: TimerTruthListener | undefined;

  // These fields get initialized by the matchConfig setter, which is used in the constructor.
  private _matchConfig!: MatchConfiguration;
  private _matchLengthSeconds!: number;
  private _secondsLeftInMatch!: number;
  private _secondsLeftInMode!: number;

  // Prevent invalid constructor argument combinations
  constructor(isSourceOfTruth: true, timerTruthBroadcaster: TimerTruthBroadcaster);
  constructor(isSourceOfTruth: false, timerTruthListener: TimerTruthListener);

  constructor(private readonly isSourceOfTruth: boolean, helper: TimerTruthBroadcaster | TimerTruthListener) {
    super();

    this.startTimeMonotonicMs = 0;
    this._mode = MatchMode.RESET;
    this.timerID = null;
    this.setMatchConfigInternal(FRC_MATCH_CONFIG);

    if (isSourceOfTruth) {
      this.initializationDataProvider = (): TimerInitializationData => ({
        matchConfig: this.matchConfig,
        matchMode: this.mode,
        secondsLeftInMatch: this.secondsLeftInMatch,
      });
      this.truthBroadcaster = helper as TimerTruthBroadcaster;
      this.truthBroadcaster.setInitializationDataProvider(this.initializationDataProvider);
    } else {
      const handleTimeRemainingUpdate = (trueSecondsLeftInMatch: number): undefined => {
        if (trueSecondsLeftInMatch < this.secondsLeftInMatch) {
          const timeReceivedMs = performance.now();
          /*
           * Our local timer is behind the source of truth. If our local timer were ahead of the
           * source of truth, that's probably just due to network latency, and we should ignore that.
           */
          /*
           * While our local timer is behind the source of truth, catch up one second at a time
           * (to ensure that all the normal state updates and events happen).
           */
          while (trueSecondsLeftInMatch < this.secondsLeftInMatch) {
            this.tick();
          }

          // Update our local start time to be less late (if appropriate), so that we don't go right back to being late next cycle.
          const originalStartTime = this.startTimeMonotonicMs;
          const trueSecondsSinceStart = this.matchLength - trueSecondsLeftInMatch;
          const startTimeBasedOnServerNotification = timeReceivedMs - (trueSecondsSinceStart * 1000);
          if (startTimeBasedOnServerNotification < originalStartTime) {
            this.startTimeMonotonicMs = startTimeBasedOnServerNotification
            console.log(`Updated startTimeMonotonicMs from ${originalStartTime} to ${this.startTimeMonotonicMs} based on server response`);
          }
        }
      };

      this.truthListener = helper as TimerTruthListener;
      this.truthListener.onInitialization(initData => {
        this.setMatchConfigInternal(initData.matchConfig);
        if (matchInProgress(initData.matchMode)) {
          this.internalStart();
          handleTimeRemainingUpdate(initData.secondsLeftInMatch);
        }
      });
      this.truthListener.onStart(() => this.internalStart());
      this.truthListener.onAbort(() => this.internalAbort());
      this.truthListener.onReset(() => this.internalReset());
      this.truthListener.onSecondsLeftInMatchUpdate(handleTimeRemainingUpdate);
      this.truthListener.requestInitialization();
    }
  }

  public start(): undefined {
    if (this.isSourceOfTruth) {
      this.internalStart();
    } else {
      throw new Error("start() can only called on a MatchTimer that is the Source of Truth")
    }
  }

  public abort(): undefined {
    if (this.isSourceOfTruth) {
      this.internalAbort();
    } else {
      throw new Error("abort() can only called on a MatchTimer that is the Source of Truth");
    }
  }

  public reset(): undefined {
    if (this.isSourceOfTruth) {
      this.internalReset();
    } else {
      throw new Error("reset() can only called on a MatchTimer that is the Source of Truth");
    }
  }

  public inProgress(): boolean {
    return matchInProgress(this.mode);
  }

  private internalStart(): undefined {
    if (!this.inProgress()) {
      if (this.isSourceOfTruth) {
        this.truthBroadcaster!.broadcastStart();
      }

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

  private stop(): undefined {
    if (this.inProgress()) {
      clearInterval(this.timerID);
      this.timerID = null;
      this._mode = MatchMode.ENDED;
      this._secondsLeftInMatch = 0;
      this.emit(MatchTimer.Events.END);
    }
  }

  private internalAbort(): undefined {
    if (this.inProgress()) {
      if (this.isSourceOfTruth) {
        this.truthBroadcaster!.broadcastAbort();
      }
      clearInterval(this.timerID);
      this.timerID = null;
      this._mode = MatchMode.ABORTED;
      this._secondsLeftInMatch = 0;
      this.emit(MatchTimer.Events.ABORT);
    }
  }

  private internalReset(): undefined {
    if (!this.inProgress()) {
      if (this.isSourceOfTruth) {
        this.truthBroadcaster!.broadcastReset();
      }
      this._mode = MatchMode.RESET;
      this.timerID = null;
      this._secondsLeftInMatch = this.matchLength;
      this._secondsLeftInMode = this.matchConfig.delayTime;
    }
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

    if (this.isSourceOfTruth) {
      this.truthBroadcaster?.broadcastSecondsLeftInMatch(this.secondsLeftInMatch);
    }

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
    if (!this.isSourceOfTruth) {
      throw new Error("matchConfig can only be set on the Source of Truth");
    }
    if (this.inProgress()) {
      throw new Error("Do not change the match config while the match timer is active");
    }

    this.setMatchConfigInternal(value);
  }

  private setMatchConfigInternal(matchConfig: MatchConfiguration) {
    this._matchConfig = matchConfig;
    this._matchLengthSeconds = matchConfig.delayTime + matchConfig.autoTime + matchConfig.transitionTime + matchConfig.teleTime;
    this._secondsLeftInMatch = this.matchLength;
    this._secondsLeftInMode = matchConfig.delayTime;

    if (this.isSourceOfTruth) {
      this.truthBroadcaster?.broadcastInitializationData(this.initializationDataProvider!());
    }
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
