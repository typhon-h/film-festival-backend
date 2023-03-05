import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.server.model';
import { isAuthenticated } from '../controllers/user.server.controller';
import path = require('path');
import fs = require('fs');
const imagesPath = 'storage/images/';
const allowedFiletypes = ['png', 'gif', 'jpeg'];


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Retrieve profile image for user: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id} found`);
    }

    try {
        const [img] = await userImages.getOne(id);
        const filepath = path.resolve(imagesPath + img.image_filename);

        if (fs.existsSync(filepath)) {
            res.status(200).sendFile(filepath);
        } else {
            res.status(404).send(`Image could not be found`);
        }

        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const setImage = async (req: Request, res: Response): Promise<void> => {
    const token = req.headers['x-authorization'];
    if (token === undefined) {
        res.status(401).send("Unauthorized.");
        return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id}`);
        return;
    }

    // Removing "image/"
    const filetype = req.headers['content-type'].replace('image/', '');
    if (!req.headers['content-type'].includes('image/')
        || !allowedFiletypes.includes(filetype)) {
        res.status(400).send('Bad Request. Invalid image supplied');
        return;
    }

    try {
        if (!((await isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot change another user's profile picture");
            return;
        }

        const filename = 'user_' + id;
        const result = await userImages.alter(id, filename + '.' + filetype);

        if (result.affectedRows === 0) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }

        // Created vs Updated

        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { getImage, setImage, deleteImage }