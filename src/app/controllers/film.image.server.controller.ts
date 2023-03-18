import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as filmImages from "../models/film.image.server.model"
import { isAuthenticated, isValidToken } from '../controllers/user.server.controller';
import { getOne } from '../models/film.server.model'
import { hasReviews } from '../controllers/film.server.controller'
import { nanoid } from "nanoid";
import path = require('path');
import filesystem = require('fs');
const fs = filesystem.promises;
const allowedFiletypes = ['png', 'gif', 'jpeg'];
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
    Logger.http(`PUT Create/Update hero picture for film: ${req.params.id}`);
    const token = req.headers['x-authorization'];

    if (token === undefined || !isValidToken(token.toString())) { // Undefined or token not exists
        res.status(401).send("Unauthorized.");
        return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).send(`No user with id ${id}`);
        return;
    }

    // Removing "image/"
    const filetype = (req.headers['content-type'] ? req.headers['content-type'].replace('image/', '') : "");
    if (!allowedFiletypes.includes(filetype)) {
        res.status(400).send('Bad Request. Invalid image supplied');
        return;
    }

    try {
        if (!((await isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot image if you are not the director");
            return;
        }
        if ((await getOne(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("Film not found.");
            return;
        }

        if ((await hasReviews(id)).valueOf()) {
            res.status(403).send("Forbidden. Film cannot be edited after it has been reviewed");
            return;
        }

        const newFilename = nanoid() + '.' + filetype;

        // Add new profile picture
        await fs.writeFile(filepath + newFilename, req.body);

        // Create
        if ((await hasImage(id)).valueOf()) {
            const oldFilename = (await filmImages.getOne(id))[0].image_filename;
            await fs.unlink(filepath + oldFilename); // TODO: possibly do this after db update (store value of condition)

            res.statusMessage = "OK. Image Updated";
            res.status(200);

        } else {
            res.statusMessage = "Created";
            res.status(201);
        }

        // Update db with new image
        const result = await filmImages.alter(id, newFilename);
        if (result.affectedRows === 0) { // Should never happen since existence is checked for 403/404 error
            await fs.unlink(filepath + newFilename); // Remove new file since not referenced in db
            throw new Error("Film no longer in database");
        }

        res.send();
        return;
    } catch (err) {  // TODO: Delete created image if update fails
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const hasImage = async (id: number): Promise<boolean> => {
    Logger.http(`Checking if film ${id} has hero image`);
    try {
        const [img] = await filmImages.getOne(id);
        return img.image_filename !== null;
    } catch (err) {
        Logger.error(err);
        return false;
    }
}

export { getImage, setImage };