import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as validator from './validate.server';
import * as films from '../models/film.server.model';
import { isValidToken, retrieve } from "./user.server.controller";
import { getAll } from "../models/film.review.server.model";
import path = require('path');
import filesystem = require('fs');
const fs = filesystem.promises;

const filepath = path.resolve('storage/images') + '/';

const viewAll = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET all films that match body criteria`);
    const validation = await validator.validate(
        validator.schemas.film_search,
        req.query
    );

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const search = (req.query.q !== undefined ? req.query.q.toString() : undefined);
    const directorId = (req.query.directorId !== undefined ? parseInt(req.query.directorId.toString(), 10) : undefined);
    const reviewerId = (req.query.reviewerId !== undefined ? parseInt(req.query.reviewerId.toString(), 10) : undefined);
    const sort = (req.query.sortBy !== undefined ? req.query.sortBy as string : undefined);
    let genreIds;
    if (Array.isArray(req.query.genreIds)) {
        genreIds = req.query.genreIds.map((str): number => {
            return parseInt(str.toString(), 10);
        });
    } else if (req.query.genreIds !== undefined) {
        genreIds = [parseInt(req.query.genreIds as string, 10)];
    }

    let ageRatings;
    if (Array.isArray(req.query.ageRatings)) {
        ageRatings = req.query.ageRatings.map((str): string => {
            return str.toString();
        });
    } else if (req.query.ageRatings !== undefined) {
        ageRatings = [req.query.ageRatings.toString()];
    }

    try {
        if (genreIds !== undefined && !(await genreExists(genreIds)).valueOf()) {
            res.status(400).send("Genre does not exist");
            return;
        }

        const result = await films.getAll(search, genreIds, ageRatings, directorId, reviewerId, sort)

        const startIndex = (req.query.startIndex !== undefined ? parseInt(req.query.startIndex.toString(), 10) : undefined);
        const count = (req.query.count !== undefined ? parseInt(req.query.count.toString(), 10) : result.length);

        let end;
        if (startIndex === undefined && count !== 0) {
            end = count;
        } else if (count === 0) {
            end = result.length;
        } else {
            end = startIndex + count; // TODO: FIX
        }


        res.status(200).send({ "films": result.slice(startIndex, end), "count": result.length });
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Film with id: ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) { // TODO: Should really be validated with ajv but appears to use this method on deployed server
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }

    try {
        const [result] = await films.getOne(id);
        if (result !== undefined) {
            delete result.image_filename;
            res.status(200).send(result);
        } else {
            res.status(404).send(`No film with id: ${id} found`);
        }

        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addOne = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST adding new film ${req.body.title}`);
    const validation = await validator.validate(
        validator.schemas.film_post,
        req.body
    );

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const title = req.body.title;
    const description = req.body.description;
    const releaseDate = req.body.releaseDate;
    const genreId = parseInt(req.body.genreId, 10);
    const runtime = req.body.runtime;
    const ageRating = req.body.ageRating;

    const token = req.headers['x-authorization'];

    try {
        if (token === undefined || !((await isValidToken(token.toString())).valueOf())) {
            res.status(401).send("Unauthorized. You must be a registered user");
            return;
        }

        if (releaseDate !== undefined && Date.parse(releaseDate) < Date.now()) {
            res.status(403).send("Forbidden. Cannot release film in the past");
            return;
        }

        if (!(await genreExists([genreId])).valueOf()) {
            res.status(400).send(`Genre id ${genreId} does not exist`);
            return;
        }

        const director = (await retrieve(token.toString())).id;

        const result = await films.insert(title, description, releaseDate, genreId, runtime, ageRating, director);

        res.status(201).send({ "filmId": result.insertId });
        return;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Forbidden. Film title is not unique";
            res.status(403).send();
            return;
        } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
            res.status(400).send("Incorrect datetime value");
            return;
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PATCH editing film ${req.params.id}`);
    const validation = await validator.validate(
        validator.schemas.film_patch,
        req.body
    );

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { // TODO: Appears this check is returning 401 not 400?
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    const token = req.headers['x-authorization'];
    const title = req.body.title;
    const description = req.body.description;
    const genreId = req.body.genreId;
    const runtime = req.body.runtime;
    const ageRating = req.body.ageRating;
    const releaseDate = req.body.releaseDate;
    if (releaseDate !== undefined
        && (Date.parse(releaseDate) <= Date.now())) { // TODO: Must be in the future vs cannot release in the past
        res.status(403).send("Release date must be in the future");
        return;
    }

    try {

        if (token === undefined || !(await isValidToken(token.toString()))) {
            res.status(401).send("Unauthorized");
            return;
        }

        if (genreId !== undefined && !(await genreExists([genreId])).valueOf()) {
            res.status(400).send(`Genre id ${genreId} does not exist`);
            return;
        }

        const [film] = await films.getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film with id ${id}`);
            return;
        }

        const director = await retrieve(token.toString());
        if (film.directorId !== director.id) {
            res.status(403).send("Forbidden. Only the director can delete a film");
            return;
        }

        if (releaseDate !== undefined && Date.parse(film.releaseDate) < Date.now()) {
            res.status(403).send("Forbidden. Release date cannot be changed after it has passed");
            return;
        }

        if ((await hasReviews(film.filmId)).valueOf()) {
            res.status(403).send("Forbidden. Film cannot be edited after it has been reviewed");
            return;
        }


        const result = await films.update(film.filmId, title, description, genreId, runtime, ageRating, releaseDate);
        if (result.affectedRows === 1) {
            res.status(200).send(`OK`);
            return;
        } else {
            res.status(404).send(`Film ${title} Not Found`);
            return;
        }

    } catch (err) {
        if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
            res.status(400).send("Incorrect datetime value");
            return;
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteOne = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`DELETE Removing film ${req.params.id}`);

    const id = parseInt(req.params.id, 10);
    const token = req.headers['x-authorization'];

    if (isNaN(id)) { // TODO: Should really be validated with ajv but appears to use this method on deployed server
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }


    try {
        if (token === undefined || !(await isValidToken(token.toString()))) {
            res.status(401).send("Unauthorized");
            return;
        }

        const [film] = await films.getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film with id ${id}`);
            return;
        }

        const director = await retrieve(token.toString());
        if (film.directorId !== director.id) {
            res.status(403).send("Forbidden. Only the director can delete a film");
            return;
        }

        const result = await films.remove(film.filmId);

        if (result.affectedRows === 1) {
            if (film.image_filename !== null) { // TODO: CHECK THIS WHEN FILM IMAGES EXIST
                await fs.unlink(filepath + film.image_filename);
            }

            res.status(200).send("OK");
            return;
        } else {
            throw new Error(`Could not delete film`);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getGenres = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET all genres`);

    try {
        const result = await films.getAllGenres();
        if (result !== undefined) {
            res.status(200).send(result);
            return;
        } else {
            throw new Error(`Could not retrieve genres`);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const genreExists = async (ids: number[]): Promise<boolean> => {
    Logger.http(`Checking if genres exist: ${ids}`);

    try {
        const genres = await films.getAllGenres();
        for (const id of ids) {
            const matches = genres.filter((genre) => {
                return genre.genreId === id;
            });

            if (matches.length === 0) {
                return false;
            }
        }

        return true;


    } catch (err) {
        Logger.error(err);
        return false;
    }
}

const hasReviews = async (id: number): Promise<boolean> => {

    try {
        const result = await getAll(id); // Reviews
        return result !== undefined && result.length > 0;
    } catch (err) {
        Logger.error(err);
        return true; // TODO: safer to assume there is a review on error?
    }
}

export { viewAll, getOne, addOne, editOne, deleteOne, getGenres, hasReviews };