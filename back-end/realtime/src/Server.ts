import express, { Application, json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import parser from "body-parser";
import jwt from "jsonwebtoken";
import { environment as env, getIPv4 } from "@toa-lib/server";
import logger from "./util/Logger.js";
import { assignRooms, initRooms, leaveRooms } from "./rooms/Rooms.js";

// Setup our environment
env.loadAndSetDefaults(process.env);

// Bind socket.io to express to our http server
const app: Application = express();
const server = createServer(app);
const io = new Server(server);

// Config middleware
app.use(cors({ credentials: true }));
app.use(json());
app.use(parser.urlencoded({ extended: false }));

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token.toString(),
      env.get().jwtSecret,
      (err, decoded) => {
        if (err) {
          return next(new Error("Authentication Error"));
        } else {
          (socket as any).decoded = decoded;
          next();
        }
      }
    );
  } else {
    next(new Error("Authentication Error: no query token present"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).decoded;
  logger.info(
    `user '${user.username}' (${socket.handshake.address}) connected and verified`
  );

  socket.on("rooms", (rooms: unknown) => {
    if (Array.isArray(rooms) && rooms.every(room => typeof room === "string")) {
      logger.info(
        `user ${user.username} (${socket.handshake.address}) joining rooms ${rooms}`
      );
      assignRooms(rooms, socket);
    } else {
      logger.warn(
        `user ${user.username} (${socket.handshake.address}) sent "rooms" event with invalid payload: ${rooms}`
      );
    }
  });

  socket.on("disconnect", (reason: string) => {
    logger.info(
      `user ${user.username} (${socket.handshake.address}) disconnected: ${reason}`
    );
    leaveRooms(socket);
  });

  socket.on("error", (err) => {
    logger.error({ err });
  });
});

initRooms(io);

// Network variables
const host = getIPv4();

server.listen(
  {
    host: "0.0.0.0",
    port: env.get().servicePort,
  },
  () => {
    logger.info(
      `[${env.get().nodeEnv.charAt(0).toUpperCase()}][${env
        .get()
        .serviceName.toUpperCase()}] Server started on ${host}:${
        env.get().servicePort
      }`
    );
  }
);
