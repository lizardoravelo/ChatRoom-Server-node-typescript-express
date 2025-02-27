import { Router } from 'express';

import { auth } from './auth.routes';
import { room } from './room.routes';

const router: Router = Router();

const routes: {
  [key: string]: (router: Router) => void;
} = { auth, room };

for (const route in routes) {
  const nestedRouter = Router();
  routes[route](nestedRouter);
  router.use(`/api/${route}`, nestedRouter);
}

export { router };
