import { Request, Response } from 'express';
import User, { IUser } from '@model/user';
import handleErrorResponse from '@error/error-handler';
import jwt from 'jsonwebtoken';
import config from '@config/constants';

interface IUserController {
  signUp: (req: Request, res: Response) => Promise<void>;
  signIn: (req: Request, res: Response) => Promise<void>;
  getAllUsers: (req: Request, res: Response) => Promise<void>;
  getUserById: (req: Request<{ id: string }>, res: Response) => Promise<void>;
  getMe: (req: Request<{}, {}, Partial<IUser>>, res: Response) => Promise<void>;
  updateUserById: (req: Request<{ id: string }>, res: Response) => Promise<void>;
  updateMe: (req: Request<{}, {}, Partial<IUser>>, res: Response) => Promise<void>;
  makeAdmin: (req: Request<{ id: string }>, res: Response) => Promise<void>;
  deleteUserById: (req: Request<{ id: string }>, res: Response) => Promise<void>;
}

const filterUserData = (user: IUser) => {
  const { password, ...filteredUser } = user.toObject();
  return filteredUser;
};

const userCtrl: IUserController = {
  signUp: async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, address, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email already registered' });
        return;
      }

      const newUser = new User({
        name,
        email,
        password,
        address,
        phone,
        role: 'user',
      });

      const savedUser = await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user: filterUserData(savedUser) },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  signIn: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.active) {
        res.status(403).json({ success: false, message: 'Account is inactive' });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Invalid password' });
        return;
      }

      const token = jwt.sign({ id: user._id, role: user.role }, config.secret, { expiresIn: '1h' });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: filterUserData(user),
          token,
        },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find().populate('role');
      res.status(200).json({
        success: true,
        data: users.map(filterUserData),
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  getUserById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.id).populate('role');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: filterUserData(user) });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  getMe: async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    try {
      const found = await User.findById(user._id).populate('role');
      if (!found) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: filterUserData(found) });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  updateUserById: async (req: Request<{ id: string }, {}, Partial<IUser>>, res: Response): Promise<void> => {
    const authUser = req.user as IUser;
    const { name, address, phone, active } = req.body;

    try {
      const updatedFields: Partial<IUser> = { name, address, phone };

      if (authUser.role === 'admin' && active !== undefined) {
        updatedFields.active = active;
      }

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: filterUserData(updatedUser) },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  updateMe: async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { name, address, phone } = req.body;

    try {
      const updatedFields: Partial<IUser> = { name, address, phone };

      const updatedUser = await User.findByIdAndUpdate(user._id, updatedFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: filterUserData(updatedUser) },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  makeAdmin: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role: 'admin' },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User promoted to admin successfully',
        data: { user: filterUserData(updatedUser) },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  deleteUserById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { user: filterUserData(deletedUser) },
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },
};

export default userCtrl;
