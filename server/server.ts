import { createServer } from 'http';
import { Server } from 'socket.io';
import { moveSchema } from '../lib/validation';
import { applyRoll } from '../lib/logic';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

type Player = { id: string; position: number; name: string };
type GameState = {
  players: Record<string, Player>;
  currentTurn: string | null;
  playerOrder: string[];
  winner: string | null;
  gameStarted: boolean;
};

const gameState: GameState = {
  players: {},
  currentTurn: null,
  playerOrder: [],
  winner: null,
  gameStarted: false,
};

function getNextTurn(): string | null {
  if (gameState.playerOrder.length === 0) return null;
  const currentIndex = gameState.playerOrder.indexOf(
    gameState.currentTurn || ''
  );
  const nextIndex = (currentIndex + 1) % gameState.playerOrder.length;
  return gameState.playerOrder[nextIndex];
}

function startGame() {
  if (gameState.playerOrder.length > 0 && !gameState.gameStarted) {
    gameState.gameStarted = true;
    gameState.currentTurn = gameState.playerOrder[0];
    io.emit('gameState', gameState);
  }
}

io.on('connection', (socket) => {
  console.log('Player connected', socket.id);

  gameState.players[socket.id] = {
    id: socket.id,
    position: 0,
    name: `Player ${Object.keys(gameState.players).length + 1}`,
  };
  gameState.playerOrder.push(socket.id);

  // Start game when first player joins or reset game
  if (gameState.playerOrder.length === 1) {
    startGame();
  }

  io.emit('gameState', gameState);

  socket.on('rollDice', (data) => {
    // Check if it's this player's turn
    if (gameState.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }

    // Check if game is over
    if (gameState.winner) {
      socket.emit('error', { message: 'Game is over!' });
      return;
    }

    const result = moveSchema.safeParse(data);
    if (!result.success) return;

    const roll = result.data.roll;
    const currentPosition = gameState.players[socket.id].position;
    const newPosition = applyRoll(currentPosition, roll);

    gameState.players[socket.id].position = newPosition;

    // Check for winner
    if (newPosition >= 100) {
      gameState.winner = socket.id;
      io.emit('gameWon', {
        winner: gameState.players[socket.id].name,
        winnerId: socket.id,
      });
    } else {
      // Move to next turn
      gameState.currentTurn = getNextTurn();
    }

    io.emit('gameState', gameState);
    io.emit('diceRolled', {
      playerId: socket.id,
      roll,
      newPosition,
    });
  });

  socket.on('resetGame', () => {
    // Reset all players to position 0
    Object.keys(gameState.players).forEach((id) => {
      gameState.players[id].position = 0;
    });
    gameState.winner = null;
    gameState.currentTurn = gameState.playerOrder[0];
    gameState.gameStarted = true;

    io.emit('gameState', gameState);
    io.emit('gameReset', {});
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    gameState.playerOrder = gameState.playerOrder.filter(
      (id) => id !== socket.id
    );

    // If disconnecting player was current turn, move to next
    if (gameState.currentTurn === socket.id) {
      gameState.currentTurn = getNextTurn();
    }

    // Reset game if no players left
    if (gameState.playerOrder.length === 0) {
      gameState.gameStarted = false;
      gameState.winner = null;
    }

    io.emit('gameState', gameState);
  });
});

httpServer.listen(4000, () =>
  console.log('Socket server running on http://localhost:4000')
);
