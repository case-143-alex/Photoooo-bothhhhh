// Custom Next.js server with Socket.IO
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory session store
const sessions = new Map();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 5e6, // 5MB for photo data
    transports: ['polling', 'websocket'],
    pingTimeout: 30000, // tolerate slower/less stable mobile connections
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id);

    // Booth creates a session
    socket.on('booth:create-session', (sessionId) => {
      sessions.set(sessionId, {
        id: sessionId,
        boothSocket: socket.id,
        phones: [],
        photos: [],
        status: 'waiting',
      });
      socket.join(`session:${sessionId}`);
      socket.join(`booth:${sessionId}`);
      console.log('[Session] Created:', sessionId);
    });

    // Phone joins session
    socket.on('phone:join-session', (sessionId) => {
      const session = sessions.get(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      session.phones.push(socket.id);
      socket.join(`session:${sessionId}`);
      socket.join(`phone:${sessionId}`);
      socket.data.sessionId = sessionId;

      // Notify booth
      io.to(`booth:${sessionId}`).emit('session:phone-joined', {
        count: session.phones.length,
      });

      // Send current state to phone
      socket.emit('session:state', {
        status: session.status,
        photos: session.photos,
      });

      console.log('[Session] Phone joined:', sessionId, '- Total phones:', session.phones.length);
    });

    // Booth sends photo preview
    socket.on('booth:photo-taken', ({ sessionId, photoIndex, photoData, isPreview }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      if (!isPreview) {
        session.photos[photoIndex] = photoData;
      }
      io.to(`phone:${sessionId}`).emit('session:photo-received', {
        photoIndex,
        photoData,
        isPreview,
      });
    });

    // Booth signals the 4 photos are done
    socket.on('booth:session-done', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.status = 'done';
      io.to(`phone:${sessionId}`).emit('session:done');
      console.log('[Session] Done:', sessionId);
    });

    // Booth updates session status
    socket.on('booth:status-update', ({ sessionId, status }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.status = status;
      io.to(`phone:${sessionId}`).emit('session:status', { status });
    });

    // Reset session (clears photos, keeps same code)
    socket.on('booth:reset-session', (sessionId) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.photos = [];
      session.status = 'waiting';
      io.to(`session:${sessionId}`).emit('session:reset');
    });

    // Booth ends the session entirely (used when starting a brand new
    // session / new code): kicks every connected phone and removes the
    // session from memory so the old code/QR stops working.
    socket.on('booth:end-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;

      io.to(`phone:${sessionId}`).emit('session:ended');

      const phoneRoom = io.sockets.adapter.rooms.get(`phone:${sessionId}`);
      if (phoneRoom) {
        for (const socketId of Array.from(phoneRoom)) {
          const phoneSocket = io.sockets.sockets.get(socketId);
          if (phoneSocket) {
            phoneSocket.leave(`session:${sessionId}`);
            phoneSocket.leave(`phone:${sessionId}`);
            // Give the 'session:ended' event a moment to actually reach
            // the client before we cut the connection.
            setTimeout(() => phoneSocket.disconnect(true), 300);
          }
        }
      }

      sessions.delete(sessionId);
      console.log('[Session] Ended:', sessionId);
    });

    socket.on('disconnect', () => {
      // Clean up phone from sessions
      const sessionId = socket.data.sessionId;
      if (sessionId) {
        const session = sessions.get(sessionId);
        if (session) {
          session.phones = session.phones.filter((id) => id !== socket.id);
          io.to(`booth:${sessionId}`).emit('session:phone-joined', {
            count: session.phones.length,
          });
        }
      }
      console.log('[Socket] Disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
