'use strict';

/**
 * Custom Artillery processor for Socket.IO load testing.
 *
 * Artillery's built-in socketio engine doesn't reliably pass
 * transport options to socket.io-client. This processor gives
 * us full control over the connection and event flow.
 *
 * Every step has a timeout guard so a missing server response
 * never hangs the entire Artillery run.
 */

const { io } = require('socket.io-client');

const STEP_TIMEOUT_MS = 5000;

/**
 * Helper: run a step with a timeout so Artillery never hangs.
 * Calls `done` exactly once.
 */
function withTimeout(fn, done, timeoutMs = STEP_TIMEOUT_MS) {
  let finished = false;
  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      done(); // let Artillery continue; the step simply didn't get a reply
    }
  }, timeoutMs);

  fn((err) => {
    if (!finished) {
      finished = true;
      clearTimeout(timer);
      done(err);
    }
  });
}

/**
 * Create a WebSocket-only Socket.IO connection and store it
 * on the virtual user context for use in subsequent steps.
 */
function connectSocket(userContext, events, done) {
  withTimeout((finish) => {
    const target = userContext.vars.target;
    const socket = io(target, {
      transports: ['websocket'],
      forceNew: true,
      timeout: STEP_TIMEOUT_MS,
    });

    socket.on('connect', () => {
      userContext.vars.socketId = socket.id;
      userContext.vars.__socket = socket;
      finish();
    });

    socket.on('connect_error', (err) => {
      events.emit('counter', 'connect_errors', 1);
      finish(err);
    });
  }, done);
}

/**
 * Wait for the initial roomsList event (sent on connect).
 */
function waitForRoomsList(userContext, events, done) {
  const socket = userContext.vars.__socket;
  if (!socket || !socket.connected) return done();

  withTimeout((finish) => {
    socket.once('roomsList', (rooms) => {
      userContext.vars.roomCount = rooms.length;
      events.emit('counter', 'rooms_listed', 1);
      finish();
    });
  }, done, 3000);
}

/**
 * Create a room and wait for roomJoined response.
 */
function createRoom(userContext, events, done) {
  const socket = userContext.vars.__socket;
  if (!socket || !socket.connected) return done();

  withTimeout((finish) => {
    const start = Date.now();
    const roomName = `ArtRoom-${Math.random().toString(36).slice(2, 8)}`;
    const playerName = `Bot-${Math.random().toString(36).slice(2, 7)}`;
    const clientId = `artillery-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    socket.once('roomJoined', (data) => {
      const latency = Date.now() - start;
      userContext.vars.roomId = data.roomId;
      userContext.vars.clientId = clientId;
      events.emit('histogram', 'create_room_latency', latency);
      events.emit('counter', 'rooms_created', 1);
      finish();
    });

    socket.once('error', (err) => {
      events.emit('counter', 'server_errors', 1);
      finish(new Error(err.message));
    });

    socket.emit('createRoom', { roomName, playerName, clientId });
  }, done);
}

/**
 * Leave the current room.
 */
function leaveRoom(userContext, events, done) {
  const socket = userContext.vars.__socket;
  const roomId = userContext.vars.roomId;
  if (!socket || !socket.connected || !roomId) return done();

  withTimeout((finish) => {
    socket.once('roomLeft', () => {
      events.emit('counter', 'rooms_left', 1);
      finish();
    });

    socket.emit('leaveRoom', { roomId });
  }, done, 3000);
}

/**
 * Disconnect the socket cleanly.
 */
function disconnectSocket(userContext, events, done) {
  const socket = userContext.vars.__socket;
  if (socket && socket.connected) {
    socket.disconnect();
  }
  done();
}

/**
 * Think / wait for a random duration between min and max ms.
 */
function think(userContext, events, done) {
  const delay = 1000 + Math.random() * 2000; // 1-3 seconds
  setTimeout(done, delay);
}

module.exports = {
  connectSocket,
  waitForRoomsList,
  createRoom,
  leaveRoom,
  disconnectSocket,
  think,
};
