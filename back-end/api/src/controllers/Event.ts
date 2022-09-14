import { isEvent } from '@toa-lib/models';
import { NextFunction, Response, Request, Router } from 'express';
import {
  createEventBase,
  createEventGameSpecifics,
  insertValue,
  selectAll,
  updateWhere
} from '../db/Database';
import { validateBody } from '../middleware/BodyValidator';
import { DataNotFoundError } from '../util/Errors';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [data] = await selectAll('event');
    if (!data) {
      return next(DataNotFoundError);
    }
    res.send(data);
  } catch (e) {
    return next(e);
  }
});

router.post(
  '/',
  validateBody(isEvent),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await insertValue('event', [req.body]);
      res.status(200).send({});
    } catch (e) {
      return next(e);
    }
  }
);

router.patch(
  '/:eventKey',
  validateBody(isEvent),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateWhere(
        'event',
        req.body,
        `eventKey = "${req.params.eventKey}"`
      );
      res.status(200).send({});
    } catch (e) {
      return next(e);
    }
  }
);

router.get(
  '/setup',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await createEventBase();
      // TODO - one-time
      await createEventGameSpecifics();
      res.status(200).send({});
    } catch (e) {
      return next(e);
    }
  }
);

export default router;