import { Router } from 'express';
import authorize from '@middleware/authorization';
import userCtrl from '@controller/auth.controller';
import { signInLimiter, signUpLimiter } from '@middleware/rateLimiter';

const { signUp, signIn, getAllUsers, getUserById, getMe, updateUserById, updateMe, deleteUserById, makeAdmin } =
  userCtrl;

export const auth = (router: Router): void => {
  // Public routes
  router.post('/signUp', signInLimiter, signUp);
  router.post('/signIn', signUpLimiter, signIn);

  // Authenticated user managing their own account
  router.get('/me', authorize(['user', 'admin']), getMe);
  router.put('/me', authorize(['user', 'admin']), updateMe);

  // Admin-only user management
  router.get('/users', authorize(['admin']), getAllUsers);

  router
    .route('/users/:id')
    .get(authorize(['admin']), getUserById)
    .put(authorize(['admin']), updateUserById)
    .delete(authorize(['admin']), deleteUserById);

  router.patch('/users/:id/role', authorize(['admin']), makeAdmin);
};
