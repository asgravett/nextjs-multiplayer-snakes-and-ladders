import { createServer } from 'http';
import { Server } from 'socket.io';
import { moveSchema } from '../lib/validation';
import { applyRoll } from '../lib/logic';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

type Player = { id: string; position: number };
const players: Record<string, Player> = {};

io.on('connection', (socket) => {
  console.log('Player connected', socket.id);
  players[socket.id] = { id: socket.id, position: 0 };

  socket.emit('updatePositions', players);

  socket.on('rollDice', (data) => {
    const result = moveSchema.safeParse(data);
    if (!result.success) return;

    const roll = result.data.roll;
    players[socket.id].position = applyRoll(players[socket.id].position, roll);

    io.emit('updatePositions', players);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updatePositions', players);
  });
});

httpServer.listen(4000, () =>
  console.log('Socket server running on http://localhost:4000')
);
