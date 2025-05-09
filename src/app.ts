import express, { Application } from 'express';
import passport from 'passport';
import { Server } from 'socket.io';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swagger';
import cors from 'cors';
import config from './config/constants';
import { router } from '@routes';
import { initializeSocket } from '@socket/index';
import { globalRateLimiter } from '@middleware/rateLimiter';
import '@config/passport'; // Load configuration

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(globalRateLimiter);
app.set('io', io);

// Routes (Dynamically Generated)
app.use(router);

// WebSockets (Socket.io)
initializeSocket(io);

// Start HTTP Server
const server = httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Swagger docs: http://localhost:${config.port}/api-docs`);
});

// Handle Process Termination
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close(() => process.exit(0));
});

// Handling Error
process.on('unhandledRejection', (err: Error) => {
  console.log(`An error occurred: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
