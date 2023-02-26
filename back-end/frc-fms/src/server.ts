import log from "./logger.js";
import { DriverstationSupport } from "./devices/driverstation.js";
import { AccesspointSupport } from "./devices/accesspoint.js";
import { SwitchSupport } from "./devices/switch.js";
import { PlcSupport } from "./devices/plc.js";
import {
    Match,
    MatchTimer,
    Event,
    MatchMode,
    MatchKey,
    Tournament,
} from "@toa-lib/models";
import { getMatch } from "./helpers/ems.js";
import { environment } from "@toa-lib/server";
import { SocketSupport } from "./devices/socket.js";
import FMSSettings from "./models/FMSSettings.js";

const logger = log("server");

const ipRegex =
    /\b(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b/;

let host = environment.get().serviceHost || "127.0.0.1";
let udpTcpListenerIp = "10.0.100.5";

if (process.argv[2] && process.argv[2].match(ipRegex)) {
    host = process.argv[2];
}

export class EmsFrcFms {
    private static _instance: EmsFrcFms;
    public _timer: MatchTimer = new MatchTimer();
    public activeMatch: Match<any> | null;
    public selectedEvent: Event | null = null;
    public allTournaments: Tournament[] | null = null;
    public activeTournament: Tournament | null = null;
    public timeLeft: number = 0;
    public matchState: number = 0;
    public event: Event;
    private dsInterval: any;
    private apInterval: any;
    private plcInterval: any;
    private settings: FMSSettings = new FMSSettings();
    public matchStateMap: Map<String, number> = new Map<String, number>([
        ["prestart", 0],
        ["timeout", 1],
        ["post-timeout", 2],
        ["start-match", 3],
        ["auto", 4],
        ["transition", 5],
        ["tele", 5],
    ]);

    private delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    constructor() {
        this.activeMatch = {} as any;
        this.event = {} as any;
        // Attempt to Authenticate to EMS and then init FMS
        this.attemptInit();
    }

    public static getInstance(): EmsFrcFms {
        if (typeof EmsFrcFms._instance === "undefined") {
            EmsFrcFms._instance = new EmsFrcFms();
        }
        return EmsFrcFms._instance;
    }

    private async attemptInit() {
        let isInit = false;
        let initializeCount = 1;
        // Loop over init until we're successful
        while (!isInit) {
            await this.initFms()
                .then(() => {
                    isInit = true;
                })
                .catch(async (err) => {
                    logger.error(
                        "❌ Failed to initialize FMS after " +
                        initializeCount +
                        " tries. Make sure API and Socket are running. Error: " +
                        err
                    );
                    initializeCount++;
                    await this.delay(5000);
                });
        }
    }

    public async initFms() {
        // Init EMS
        await SocketSupport.getInstance().initSocket();

        // Add some socket events
        await this.setupSocketEvents();

        // Load Settings from EMS DB
        await this.loadSettings();

        // Init Timer
        this._timer = new MatchTimer();
        this.initTimer();
        this.timeLeft = this._timer.timeLeft;

        // Init DriverStation listeners
        DriverstationSupport.getInstance().dsInit(udpTcpListenerIp);

        // If advanced networking is enabled
        if (this.settings.enableAdvNet) {
            // Init AccessPoint settings to default
            AccesspointSupport.getInstance().setSettings(
                this.settings.apIp,
                this.settings.apUsername,
                this.settings.apPassword,
                this.settings.apTeamCh,
                this.settings.apAdminCh,
                this.settings.apAdminWpa,
                this.settings.enableAdvNet,
                [],
                false
            );

            // Start AP
            clearInterval(this.apInterval);
            this.startAPLoop();

            // Init Switch Configuration Tools
            // The Switch manager doesn't have a loop, it runs on prestart.
            SwitchSupport.getInstance().setSettings(
                this.settings.switchIp,
                "cisco",
                this.settings.switchPassword
            );

            // If PLC is enabled, configure and start it
            if (this.settings.enablePlc) {
                await PlcSupport.getInstance().initPlc(this.settings.plcIp);
                clearInterval(this.plcInterval);
                this.startPLC();
            }
        }

        // Start FMS Services Updates
        this.startDriverStation();
    }

    private async setupSocketEvents() {
        SocketSupport.getInstance().socket?.on("frc-fms:settings-update", (data: string) => {
            this.updateSettings(JSON.parse(data));
            SocketSupport.getInstance().settingsUpdateSuccess(this.settings);
        });

        // Manage Socket Events
        SocketSupport.getInstance().socket?.on("match:prestart", (matchKey: MatchKey) => {
            logger.info("🔁 Prestart Command Issued");
            this.matchState = MatchMode.PRESTART;
            this.fmsOnPrestart(matchKey);
        });
    }

    private async loadSettings() {
        // TODO: This will come through socket
        // const events = await EMSProvider.getEvent();
        const events: any[] = [];
        if (events && events.length > 0) {
            this.event = events[0];
            // TODO: Config
            // const config = await EMSProvider.getAdvNetConfig(this.event.eventKey);
            const config: any = {};
            if (!config.error) {
                this.settings = new FMSSettings().fromJson(config);
                logger.info(
                    "✔ Loaded Settings for FMS with event " + this.event.eventKey
                );
            } else {
                // await EMSProvider.postAdvNetConfig(this.event.eventKey, this.settings.toJson());
                logger.info(
                    "❗ No FMS configuration found for " +
                    this.event.eventKey +
                    ". Running with default settings."
                );
            }
        } else {
            logger.info("✔ No event found. Running with default settings.");
        }
    }

    private async updateSettings(newSettings: object) {
        this.settings = new FMSSettings().fromJson(newSettings);
        // Update AP Settings
        if (this.settings.enableAdvNet) {
            AccesspointSupport.getInstance().setSettings(
                this.settings.apIp,
                this.settings.apUsername,
                this.settings.apPassword,
                this.settings.apTeamCh,
                this.settings.apAdminCh,
                this.settings.apAdminWpa,
                this.settings.enableAdvNet,
                [],
                false
            );
            clearInterval(this.apInterval);
            this.startAPLoop();
        } else {
            clearInterval(this.apInterval);
        }
        // Update Switch Settings
        if (this.settings.enableAdvNet)
            SwitchSupport.getInstance().setSettings(
                this.settings.switchIp,
                "cisco",
                this.settings.switchPassword
            );
        // Update PLC Settings
        if (this.settings.enableAdvNet && this.settings.enablePlc) {
            await PlcSupport.getInstance().initPlc(this.settings.plcIp);
            clearInterval(this.plcInterval);
            this.startPLC();
        } else {
            clearInterval(this.plcInterval);
        }
        logger.info("✔ Updated Settings!");
    }

    private async fmsOnPrestart(matchKey: MatchKey) {
        this.activeMatch = await this.getMatch(matchKey).catch((err) => {
            logger.error("❌ Error getting participant information: " + err);
            return null;
        });

        if (!this.activeMatch) {
            logger.error("❌ Received prestart command, but found no active match");
            return;
        }

        // Call DriverStation Prestart
        DriverstationSupport.getInstance().onPrestart(this.activeMatch);
        if (this.settings.enableAdvNet) {
            // Configure AP
            AccesspointSupport.getInstance().handleTeamWifiConfig(
                this.activeMatch.eventKey,
                this.activeMatch.participants ?? []
            );
            // Configure Switch
            SwitchSupport.getInstance().configTeamEthernet(this.activeMatch.participants ?? []);
        }
        if (this.settings.enableAdvNet && this.settings.enablePlc) {
            // Set Field Lights
            PlcSupport.getInstance().onPrestart();
        }
    }

    private initTimer() {
        SocketSupport.getInstance().socket?.on("match:start", () => {
            // this._timer.matchConfig = timerConfig;
            // Signal DriverStation Start
            DriverstationSupport.getInstance().driverStationMatchStart();
            this._timer.on("timer:auto", () => {
                this.matchState = MatchMode.AUTONOMOUS;
                logger.info("▶ Autonomous");
            });
            this._timer.on("timer:transition", () => {
                this.matchState = MatchMode.TRANSITION;
                logger.info("▶ Transistion");
            });
            this._timer.on("timer:tele", () => {
                this.matchState = MatchMode.TELEOPERATED;
                logger.info("▶ Teleoperated");
            });
            this._timer.on("timer:endgame", () => {
                this.matchState = MatchMode.ENDGAME;
                logger.info("▶ Endgame");
            });
            this._timer.on("timer:end", () => {
                this.removeMatchlisteners();
                this.matchState = MatchMode.ENDED;
                logger.info("⏹ Local Timer Ended");
            });

            logger.info("▶ Match Started");
            this._timer.start();
            this.matchState = MatchMode.AUTONOMOUS;
            this.timeLeft = this._timer.timeLeft;
            const timerID = global.setInterval(() => {
                this.timeLeft = this._timer.timeLeft;
                if (this._timer.timeLeft <= 0) {
                    this.timeLeft = this._timer.timeLeft;
                    global.clearInterval(timerID);
                }
            }, 1000);
        });
        SocketSupport.getInstance().socket?.on("match:end", () => {
            this._timer.stop();
            this.timeLeft = this._timer.timeLeft;
            this.matchState = MatchMode.ENDED;
            this.removeMatchlisteners();
            logger.info("⏹ Remote Timer Ended");
        });
        SocketSupport.getInstance().socket?.on("match:abort", () => {
            this._timer.abort();
            this.timeLeft = this._timer.timeLeft;
            this.matchState = MatchMode.ABORTED;
            this.removeMatchlisteners();
            logger.info("🛑 Match Aborted");
        });
    }

    private removeMatchlisteners() {
        this._timer.removeAllListeners("timer:auto");
        this._timer.removeAllListeners("timer:transition");
        this._timer.removeAllListeners("timer:tele");
        this._timer.removeAllListeners("timer:endgame");
        this._timer.removeAllListeners("timer:end");
    }

    private startDriverStation() {
        this.dsInterval = setInterval(() => {
            DriverstationSupport.getInstance().runDriverStations();
        }, 500);
        logger.info("✔ Driver Station Manager Init Complete, Running Loop");
    }

    private startPLC() {
        this.plcInterval = setInterval(() => {
            PlcSupport.getInstance().runPlc();
        }, 100);
        logger.info("✔ PLC Manager Init Complete, Running Loop");
    }

    private startAPLoop() {
        this.apInterval = setInterval(async () => {
            await AccesspointSupport.getInstance().runAp();
        }, 3000);
        logger.info("✔ Access Point Manager Init Complete, Running Loop");
    }

    private getMatch(prestartData: MatchKey): Promise<Match<any>> {
        return new Promise<Match<any>>((resolve, reject) => {
            getMatch(prestartData)
                .then((match: Match<any>) => {
                    resolve(match);
                })
                .catch((err) => {
                    logger.error("❌ Error getting match: " + err);
                    reject(null);
                });
        });
    }
}

export default EmsFrcFms.getInstance();
