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

    // Reset session
    socket.on('booth:reset-session', (sessionId) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.photos = [];
      session.status = 'waiting';
      io.to(`session:${sessionId}`).emit('session:reset');
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
