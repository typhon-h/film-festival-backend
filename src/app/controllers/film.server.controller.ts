import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as validator from './validate.server';
import * as films from '../models/film.server.model';



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
        if (!(await genreExists(genreIds)).valueOf()) {
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
            end = startIndex + count; //TODO: FIX
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

const addOne = async (req: Request, res: Response): Promise<void> => {
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

const genreExists = async (ids: number[]): Promise<boolean> => {
    try {
        const genres = await films.getAllGenres();
        for (let id in ids) {
            const matches = genres.filter((genre) => {
                return genre.genreId === ids[parseInt(id, 10)];
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