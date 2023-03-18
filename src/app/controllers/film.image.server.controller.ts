import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as filmImages from "../models/film.image.server.model"
import path = require('path');
import filesystem = require('fs');
const fs = filesystem.promises;

const filepath = path.resolve('storage/images') + '/';

const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Retrieve hero image for film: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(400).send(`Invalid id: ${id}`);
        return;
    }

    try {
        const [img] = await filmImages.getOne(id);

        if (img === undefined) {
            res.status(404).send(`No film with id ${id} or No image`);
            return;
        }

        const file = path.resolve(filepath + img.image_filename);

        await fs.access(file); // Try to access to confirm existence

        res.status(200).sendFile(file);
        return;
    } catch (err) {
        if (err.code === 'ENOENT') { // Missing file or directory
            res.status(404).send(`Image could not be found`);
        } else {
            Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
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

export { getImage, setImage };