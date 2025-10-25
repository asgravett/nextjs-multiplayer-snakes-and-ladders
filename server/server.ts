import { createServer } from 'http';
import { Server } from 'socket.io';
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  socket.on('disconnect', () => console.log('disconnected', socket.id));
});

httpServer.listen(4000, () => console.log('server on 4000'));
