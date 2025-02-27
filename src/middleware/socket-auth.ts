import { Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@model/user';
import config from '@config/constants';
import User from '@model/user';

export interface AuthenticatedSocket extends Socket {
  user: IUser;
}

interface DecodedUserToken extends JwtPayload {
  id: string;
  role: string;
}

export const verifySocketToken = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      throw new Error('Authentication token is required');
    }

    // Verify token and decode user information
    const decoded = (await jwt.verify(token, config.secret)) as DecodedUserToken;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('User not found in database');
      throw new Error('User not found');
    }

    // Add user information to socket
    socket.data.user = user;

    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};
