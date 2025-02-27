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
  updateUserById: (req: Request<{ id: string }, {}, Partial<IUser>>, res: Response) => Promise<void>;
  deleteUserById: (req: Request<{ id: string }>, res: Response) => Promise<void>;
}

const filterUserData = (user: IUser) => {
  const { password, ...filteredUser } = user.toObject();
  return filteredUser;
};

const userCtrl: IUserController = {
  signUp: async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, address, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const newUser = new User({
        name,
        email,
        password,
        address,
        phone,
        role: role || 'user',
      });

      const savedUser = await newUser.save();
      const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, config.secret, { expiresIn: '1h' });

      res.status(201).json({
        message: 'User registered successfully',
        user: filterUserData(savedUser),
        token,
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  signIn: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.active) {
        res.status(403).json({ error: 'Account is inactive' });
        return;
      }

      const isPasswordValid = user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }

      const token = jwt.sign({ id: user._id, role: user.role }, config.secret, { expiresIn: '1h' });

      res.status(200).json({
        message: 'Login successful',
        user: filterUserData(user),
        token,
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },

  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find().populate('role');
      res.status(200).json(users.map(filterUserData));
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },
  getUserById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.id).populate('role');
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(filterUserData(user));
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },
  updateUserById: async (req: Request<{ id: string }, {}, Partial<IUser>>, res: Response): Promise<void> => {
    const { name, email, password, address, phone, role, active } = req.body;

    try {
      const updatedFields: Partial<IUser> = { name, email, address, phone, role, active };
      if (password) {
        updatedFields.password = password;
      }

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        message: 'User updated successfully',
        user: filterUserData(updatedUser),
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },
  deleteUserById: async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json({
        message: 'User deleted successfully',
        user: filterUserData(deletedUser),
      });
    } catch (err) {
      handleErrorResponse(res, err);
    }
  },
};

export default userCtrl;
