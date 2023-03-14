import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.server.model';
import { isAuthenticated, isValidToken } from '../controllers/user.server.controller';
import { getOne } from "../models/user.server.model";
import { nanoid } from 'nanoid';
import path = require('path');
import fs = require('fs');
const filepath = path.resolve('storage/images') + '/';
const allowedFiletypes = ['png', 'gif', 'jpeg'];


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Retrieve profile image for user: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id} found`);
    }

    try {
        const [img] = await userImages.getOne(id);
        const file = path.resolve(filepath + img.image_filename);

        if (fs.existsSync(file)) {
            res.status(200).sendFile(file);
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
        if ((await getOne(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }

        const newFilename = nanoid() + '.' + filetype;

        // Add new profile picture
        fs.writeFile(filepath + newFilename, req.body, (err) => {
            if (err !== null) {
                Logger.error(err);
                res.statusMessage = "Error occured saving image";
                res.status(500).send();
            }
        });

        // Create
        if ((await hasImage(id)).valueOf()) {
            const oldFilename = (await userImages.getOne(id))[0].image_filename;
            fs.unlink(filepath + oldFilename, (err) => { // Delete old
                if (err !== null) {
                    Logger.error(err);
                    res.statusMessage = "Error occured deleting old image";
                    res.status(500).send();
                }
            }); //TODO: Possibly delete created image if update fails

            res.statusMessage = "OK. Image Updated";
            res.status(200);

        } else {
            res.statusMessage = "Created";
            res.status(201);
        }

        // Update db with new image
        const result = await userImages.alter(id, newFilename);
        if (result.affectedRows === 0) { // Should never happen since existence is checked for 403/404 error
            throw new Error("User no longer in database");
            //TODO: delete the created file since there is now no reference to it
        }

        res.send();
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

const hasImage = async (id: number): Promise<boolean> => {
    try {
        const [img] = await userImages.getOne(id);
        return img.image_filename !== null;
    } catch (err) {
        Logger.error(err);
        return false;
    }
}


export { getImage, setImage, deleteImage }