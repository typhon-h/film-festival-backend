import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as validator from './validate.server';
import * as films from '../models/film.server.model';
import { isValidToken, retrieve } from "./user.server.controller";

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

    if (isNaN(id)) { // TODO: Check with Morgan if 400 is required or leave as 500
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }

    try {
        const [result] = await films.getOne(id);
        if (result !== undefined) {
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
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
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

const deleteOne = async (req: Request, res: Response): Promise<void> => {
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

const getGenres = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET all genres`);

    try {
        const result = await films.getAllGenres();
        res.status(200).send(result);
        return;
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

export { viewAll, getOne, addOne, editOne, deleteOne, getGenres };