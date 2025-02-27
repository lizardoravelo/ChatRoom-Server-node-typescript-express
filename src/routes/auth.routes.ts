import { Router } from 'express';
import authorize from '@middleware/authorization';
import userCtrl from '@controller/auth.controller';

const { signUp, signIn, getAllUsers, getUserById, updateUserById, deleteUserById } = userCtrl;

export const auth = (router: Router): void => {
  router.post('/signUp', signUp);

  router.post('/signIn', signIn);

  router.route('/users').get(authorize(['admin']), getAllUsers);

  router
    .route('/users/:id')
    .get(authorize(['admin', 'user']), getUserById)
    .put(authorize(['admin', 'user']), updateUserById)
    .delete(authorize(['admin']), deleteUserById);
};
