import { Server, Socket } from 'socket.io';
import { verifySocketToken } from '@middleware/socket-auth';
import { IUser } from '@model/user';
import config from '@config/constants';

export interface AuthenticatedSocket extends Socket {
  user: IUser;
}

// Map to track active sockets by user ID
const activeSockets = new Map<string, string>();

export const initializeSocket = (io: Server) => {
  // Apply authentication middleware
  io.use(verifySocketToken);

  // Handle connection errors
  io.engine.on('connection_error', err => {
    console.log(`Socket connection error: ${err.message}`);
    console.log(`Error code: ${err.code}`);
    console.log(`Context: ${JSON.stringify(err.context)}`);
  });

  io.on('connection', (socket: Socket) => {
    const authenticatedSocket = socket;

    if (!socket.data.user) {
      console.error('User data is missing in socket connection.');
      return socket.disconnect();
    }

    const userId = String(socket.data.user._id);

    console.log(`User connected: ${socket.data.user.name} (${socket.data.user.email})`);
    console.log(`Socket ID: ${socket.id}`);

    activeSockets.set(userId, socket.id);

    authenticatedSocket.on('join room', async (roomId: string) => {
      try {
        if (!socket.data.user.active) {
          throw new Error('Account is inactive');
        }

        if (!socket.data.user.role || !config.roles.includes(socket.data.user.role)) {
          throw new Error('Invalid user role');
        }

        authenticatedSocket.join(roomId);
        console.log(`User ${socket.data.user.email} joined room ${roomId}`);
        console.log(`Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));

        socket.to(roomId).emit('user joined', {
          userId: socket.data.user._id,
          username: socket.data.user.email,
          role: socket.data.user.role,
        });

        const sockets = await io.in(roomId).fetchSockets();
        const activeUsers = sockets.map(sock => ({
          userId: sock.data.user?._id,
          username: sock.data.user?.email,
        }));

        io.to(roomId).emit('active users', activeUsers);
      } catch (error) {
        console.error('Error joining room:', error);
        authenticatedSocket.emit('error', {
          type: 'JOIN_ROOM_ERROR',
          message: error instanceof Error ? error.message : 'Could not join room',
        });
      }
    });

    authenticatedSocket.on('sendMessage', message => {
      const { roomId, content, userId, createdAt, _id } = message;

      if (!roomId) {
        authenticatedSocket.emit('error', { type: 'SEND_MESSAGE_ERROR', message: 'Invalid room ID' });
        return;
      }

      console.log(`Message from ${socket.data.user.email} in room ${roomId}:`, content);
      console.log(`Broadcasting to room ${roomId}`);
      console.log(`Socket rooms:`, Array.from(socket.rooms));

      const formattedMessage = {
        _id: _id || message._id,
        roomId,
        content,
        userId: typeof userId === 'object' ? userId : { _id: userId, email: socket.data.user.email },
        createdAt,
      };

      io.to(roomId).emit('newMessage', formattedMessage);
    });

    authenticatedSocket.on('leave room', (roomId: string) => {
      authenticatedSocket.leave(roomId);
      console.log(`User ${socket.data.user.email} left room ${roomId}`);

      authenticatedSocket.to(roomId).emit('user left', {
        userId: socket.data.user._id,
        username: socket.data.user.email,
      });
    });

    authenticatedSocket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.name} (${socket.data.user.email})`);

      // Only remove from activeSockets if this is the socket we're tracking
      if (activeSockets.get(userId) === socket.id) {
        activeSockets.delete(userId);
      }

      // Notify rooms that user has left
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          io.to(roomId).emit('user left', {
            userId: socket.data.user._id,
            username: socket.data.user.email,
          });
        }
      });
    });
  });
};
