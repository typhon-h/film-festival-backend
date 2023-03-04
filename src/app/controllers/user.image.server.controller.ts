import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.server.model';

import path = require('path');
import fs = require('fs');


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Retrieve profile image for user: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id} found`);
    }

    try {
        const [img] = await userImages.getImage(id);
        const filepath = path.resolve('storage/images/' + img.image_filename);

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