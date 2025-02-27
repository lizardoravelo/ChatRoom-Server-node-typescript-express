import { Router } from 'express';
import authorize from '@middleware/authorization';
import roomCtrl from '@controller/room.controller';
import messageCtrl from '@controller/message.controller';

const { getRooms, createRoom } = roomCtrl;
const { getMessages, sendMessage } = messageCtrl;

export const room = (router: Router): void => {
  router
    .route('/')
    .get(authorize(['admin', 'user']), getRooms)
    .post(authorize(['admin', 'user']), createRoom);

  //Message Routes
  router
    .route('/:roomId/messages')
    .get(authorize(['admin', 'user']), getMessages)
    .post(authorize(['admin', 'user']), sendMessage);
};
