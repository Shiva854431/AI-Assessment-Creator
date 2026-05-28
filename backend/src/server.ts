import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/database';
import assignmentRoutes from './routes/assignments';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow multiple origins for CORS (localhost:3000 and browser preview port)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:42865',
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-assignment', (assignmentId: string) => {
    socket.join(`assignment-${assignmentId}`);
    console.log(`Socket ${socket.id} joined assignment ${assignmentId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io instance available globally for use in routes
declare global {
  var io: Server;
}
global.io = io;

// Start server
async function startServer() {
  try {
    // Connect to database (optional for demo mode)
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        console.log('Database connected');
      } catch (dbError) {
        console.warn('Database connection failed, running in demo mode:', dbError.message);
      }
    } else {
      console.warn('MONGODB_URI not set, running in demo mode without database');
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
      console.log(`Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
