import passport from 'passport';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '@model/user';
import { AuthError } from '@error/auth-error';

export interface IAuthenticatedRequest extends Request {
  user: IUser;
}

const handleJWT =
  (req: Request, res: Response, next: NextFunction, roles: string[]) =>
  async (err: any, user: IUser | false, info: any) => {
    try {
      // Handle passport errors
      if (err) {
        throw new AuthError(httpStatus.UNAUTHORIZED, 'Authentication failed');
      }

      // Handle missing or invalid user
      if (!user) {
        throw new AuthError(httpStatus.UNAUTHORIZED, info?.message ?? 'Invalid credentials');
      }

      // Check role authorization
      if (roles?.length && !roles.includes(user.role)) {
        throw new AuthError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
      }

      (req as IAuthenticatedRequest).user = user;
      next();
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Authentication error occurred',
      });
    }
  };

const authorize =
  (roles: string[] = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    return passport.authenticate('jwt', { session: false }, handleJWT(req, res, next, roles))(req, res, next);
  };

export default authorize;
