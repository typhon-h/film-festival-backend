import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.server.model';
import { isAuthenticated, isValidToken } from '../controllers/user.server.controller';
import { getOneById } from "../models/user.server.model";
import { nanoid } from 'nanoid';
import path = require('path');
import filesystem = require('fs');
const fs = filesystem.promises;

const filepath = path.resolve('storage/images') + '/';
const allowedFiletypes = ['png', 'gif', 'jpeg'];


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Retrieve profile image for user: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id} found`);
        return;
    }

    try {
        const [img] = await userImages.getOne(id);
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
    Logger.http(`PUT Create/Update profile picture for user: ${req.params.id}`);
    const token = req.headers['x-authorization'];

    if (token === undefined || !isValidToken(token.toString())) { // Undefined or token not exists
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
    if (!req.headers['content-type'].includes('image/') // includes may be redundant
        || !allowedFiletypes.includes(filetype)) {
        res.status(400).send('Bad Request. Invalid image supplied');
        return;
    }

    try {
        if (!((await isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot change another user's profile picture");
            return;
        }
        if ((await getOneById(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }

        const newFilename = nanoid() + '.' + filetype;

        // Add new profile picture
        await fs.writeFile(filepath + newFilename, req.body);

        // Create
        if ((await hasImage(id)).valueOf()) {
            const oldFilename = (await userImages.getOne(id))[0].image_filename;
            await fs.unlink(filepath + oldFilename); // TODO: possibly do this after db update (store value of condition)

            res.statusMessage = "OK. Image Updated";
            res.status(200);

        } else {
            res.statusMessage = "Created";
            res.status(201);
        }

        // Update db with new image
        const result = await userImages.alter(id, newFilename);
        if (result.affectedRows === 0) { // Should never happen since existence is checked for 403/404 error
            await fs.unlink(filepath + newFilename); // Remove new file since not referenced in db
            throw new Error("User no longer in database");
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


const deleteImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`DELETE Remove profile picture for user: ${req.params.id}`);
    const token = req.headers['x-authorization'];

    if (token === undefined || !isValidToken(token.toString())) { // Undefined or token not exists
        res.status(401).send("Unauthorized.");
        return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id}`);
        return;
    }

    try {
        if (!((await isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot delete another user's profile picture");
            return;
        }
        if ((await getOneById(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }

        const [img] = await userImages.getOne(id);

        await fs.unlink(filepath + img.image_filename);

        userImages.alter(id, null);

        res.status(200).send("Image deleted");
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const hasImage = async (id: number): Promise<boolean> => {
    Logger.http(`Checking if user ${id} has profile image`);
    try {
        const [img] = await userImages.getOne(id);
        return img.image_filename !== null;
    } catch (err) {
        Logger.error(err);
        return false;
    }
}


export { getImage, setImage, deleteImage }