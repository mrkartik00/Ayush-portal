import express from 'express';
export const startupRouter = express.Router();

import { verifyJWT } from '../middlewares';

import {
    addStartup,
    updateStartup,
    deleteStartup,
    getStartup,
    getAllStartups,
    getUserStartups,
} from '../controllers/startup.Controller';

startupRouter.route('/add').post(verifyJWT, addStartup);
startupRouter.route('/get-startups').get(verifyJWT, getUserStartups);
startupRouter
    .route('/:startupId')
    .get(verifyJWT, getStartup)
    .put(verifyJWT, updateStartup)
    .delete(verifyJWT, deleteStartup);

startupRouter.route('/').get(verifyJWT, getAllStartups);