import {
  AllianceMember,
  getFunctionsBySeasonKey,
  getSeasonKeyFromEventKey,
  Match as MatchObj,
  MatchKey,
  MatchSocketEvent,
  MatchState,
  MatchTimer,
  TimerInitializationData,
} from "@toa-lib/models";
import { EventEmitter } from "node:events";
import { Server, Socket } from "socket.io";
import logger from "../util/Logger.js";
import Room from "./Room.js";

export default class Match extends Room {
  private key: MatchKey | null;
  private match: MatchObj<any> | null;
  private timer: MatchTimer;
  private state: MatchState;
  private displayID: number;
  private timerInitializationDataProvider: (() => TimerInitializationData) | undefined;
  private secondsSinceLastTimerSyncBroadcast: number;
  public readonly localEmitter: EventEmitter;

  public constructor(server: Server) {
    super(server, "match");

    this.key = null;
    this.match = null;
    this.state = MatchState.MATCH_NOT_SELECTED;
    this.displayID = 0;
    this.localEmitter = new EventEmitter();
    this.secondsSinceLastTimerSyncBroadcast = 0;

    const matchRoom: Match = this;
    this.timer = new MatchTimer(true, {
      setInitializationDataProvider(provider: () => TimerInitializationData): undefined {
        matchRoom.timerInitializationDataProvider = provider;
      },
      broadcastInitializationData(initializationData: TimerInitializationData): undefined {
        matchRoom.emitToAll(MatchSocketEvent.INIT_TIMER, initializationData);
      },
      broadcastStart(): undefined {
        matchRoom.emitToAll(MatchSocketEvent.START);
      },
      broadcastAbort(): undefined {
        matchRoom.emitToAll(MatchSocketEvent.ABORT);
      },
      broadcastReset(): undefined {
        matchRoom.emitToAll(MatchSocketEvent.RESET_TIMER);
      },
      broadcastSecondsLeftInMatch(secondsLeftInMatch: number): undefined {
        // Avoid overloading the system by not sending these sync updates to the Web Sockets every second.
        // However, local events should be sent every second.
        if (matchRoom.secondsSinceLastTimerSyncBroadcast >= 5) {
          matchRoom.emitToAll(MatchSocketEvent.SECONDS_REMAINING, secondsLeftInMatch);
          matchRoom.secondsSinceLastTimerSyncBroadcast = 0;
        } else {
          matchRoom.localEmitter.emit(MatchSocketEvent.SECONDS_REMAINING, secondsLeftInMatch);
          matchRoom.secondsSinceLastTimerSyncBroadcast++;
        }
      },
    });
  }

  public initializeEvents(socket: Socket): void {
    if (this.timerInitializationDataProvider) {
      socket.emit(MatchSocketEvent.INIT_TIMER, this.timerInitializationDataProvider());
    }

    socket.on(MatchSocketEvent.REQUEST_TIMER_INIT, () => {
      if (this.timerInitializationDataProvider) {
        socket.emit(MatchSocketEvent.INIT_TIMER, this.timerInitializationDataProvider());
      }
    });

    // Emit the last known display
    socket.emit(MatchSocketEvent.DISPLAY, this.displayID);

    // These are in case of mid-match disconnect/reconnects
    if (
      this.state >= MatchState.PRESTART_COMPLETE &&
      this.state !== MatchState.MATCH_COMPLETE &&
      this.key &&
      !this.timer.inProgress()
    ) {
      // Send prestart information
      socket.emit(MatchSocketEvent.PRESTART, this.key);
      socket.emit(MatchSocketEvent.DISPLAY, this.displayID);
    }

    if (
      (this.timer.inProgress() && this.match) ||
      this.state === MatchState.MATCH_COMPLETE
    ) {
      socket.emit(MatchSocketEvent.UPDATE, this.match);
    } else if (this.timer.inProgress() && !this.match) {
      logger.warn("no match data for this match - sending prestart");
      socket.emit(MatchSocketEvent.PRESTART, this.key);
    }

    if (this.state === MatchState.RESULTS_COMMITTED) {
      socket.emit(MatchSocketEvent.COMMIT, this.key);
    }

    // Event listener to remove soon
    socket.on(MatchSocketEvent.ALLIANCE, (newAlliance: AllianceMember[]) => {
      this.emitToAll(MatchSocketEvent.ALLIANCE, newAlliance);
    });

    // Event listeners for matches
    socket.on(MatchSocketEvent.PRESTART, (key: MatchKey) => {
      this.key = key;
      this.emitToAll(MatchSocketEvent.PRESTART, key);
      this.emitToAll(MatchSocketEvent.DISPLAY, 1);
      this.displayID = 1;
      this.timer.reset();
      this.state = MatchState.PRESTART_COMPLETE;
      logger.info(`prestarting ${key.eventKey}-${key.tournamentKey}-${key.id}`);
    });
    socket.on(MatchSocketEvent.ABORT, () => {
      this.key = null;
      this.timer.abort();
      this.state = MatchState.MATCH_ABORTED;
    });
    socket.on(MatchSocketEvent.START, () => {
      if (this.timer.inProgress()) return;
      this.timer.once(MatchTimer.Events.START, () => {
        this.emitToAll(MatchSocketEvent.START, "start");
        this.state = MatchState.MATCH_IN_PROGRESS;
        logger.info("match in progress");
      });
      this.timer.once(MatchTimer.Events.AUTONOMOUS, () => {
        this.emitToAll(MatchSocketEvent.AUTONOMOUS);
        logger.info("match auto");
      });
      this.timer.once(MatchTimer.Events.TELEOPERATED, () => {
        this.emitToAll(MatchSocketEvent.TELEOPERATED);
        logger.info("match tele");
      });
      this.timer.once(MatchTimer.Events.ENDGAME, () => {
        this.emitToAll(MatchSocketEvent.ENDGAME);
        logger.info("match endgame");
      });
      this.timer.once(MatchTimer.Events.END, () => {
        this.emitToAll(MatchSocketEvent.END);
        this.timer.removeAllListeners();
        this.state = MatchState.MATCH_COMPLETE;
        logger.info("match completed");
      });
      this.timer.once(MatchTimer.Events.ABORT, () => {
        // We don't need to emit an ABORT event here,
        // because the timer will have called broadcastAbort()
        this.timer.removeAllListeners();
        this.state = MatchState.PRESTART_READY;
        logger.info("match aborted");
      });
      this.displayID = 2;
      this.timer.start();
      logger.info(
        `match started: ${this.key?.eventKey}-${this.key?.tournamentKey}-${this.key?.id}`
      );
    });
    socket.on(MatchSocketEvent.DISPLAY, (id: number) => {
      this.displayID = id;
      this.emitToAll(MatchSocketEvent.DISPLAY, id);
    });
    socket.on(MatchSocketEvent.UPDATE, (match: MatchObj<any>) => {
      this.match = { ...match };
      const seasonKey = getSeasonKeyFromEventKey(match.eventKey);
      const functions = getFunctionsBySeasonKey(seasonKey);
      if (
        !match.details ||
        !functions ||
        this.state >= MatchState.RESULTS_COMMITTED
      )
        return;
      const [redScore, blueScore] = functions.calculateScore(this.match);
      this.match.redScore = redScore;
      this.match.blueScore = blueScore;
      if (functions.calculateRankingPoints) {
        this.match.details = functions.calculateRankingPoints(
          this.match.details
        );
      }
      this.emitToAll(MatchSocketEvent.UPDATE, this.match);
    });
    socket.on(MatchSocketEvent.COMMIT, (key: MatchKey) => {
      this.emitToAll(MatchSocketEvent.COMMIT, key);
      this.match = null;
      this.state = MatchState.RESULTS_COMMITTED;
      logger.info(
        `committing scores for ${key.eventKey}-${key.tournamentKey}-${key.id}`
      );
    });
  }

  private emitToAll(event: MatchSocketEvent, ...args: any[]): void {
    this.localEmitter.emit(event, ...args);
    this.broadcast().emit(event, ...args);
  }
}
