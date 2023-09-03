import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as reviews from "../models/film.review.server.model";
import { getOne } from "../models/film.server.model";
import * as validator from './validate.server';
import { isValidToken, isAuthenticated, retrieve } from "./user.server.controller";




const getReviews = async (req: Request, res: Response): Promise<void> => {
    // // Logger.http(`GET all reviews for film ${req.params.id}`);

    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }

    try {

        const film = await getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film found with id ${id}`);
            return;
        }

        const result = await reviews.getAll(id);
        if (result !== undefined) {
            res.status(200).send(result);
            return;
        } else {
            throw new Error(`Reviews could not be retrieved`);
        }
    } catch (err) {
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
    // Logger.http(`POST create a review for film: ${req.params.id}`);
    const validation = await validator.validate(
        validator.schemas.film_review_post,
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

    const rating = req.body.rating;
    if (rating === undefined) {
        res.status(400).send("Bad Request. Rating is required");
        return;
    }
    const review = req.body.review;
    const token = req.headers['x-authorization'];


    try {
        if (token === undefined || !((await isValidToken(token.toString())).valueOf())) {
            res.status(401).send("Unauthorized. You must be a registered user");
            return;
        }

        const [film] = await getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film found with id ${id}`);
            return;
        }

        if ((await isAuthenticated(film.directorId, token.toString())).valueOf()) {
            res.status(403).send("Forbidden. Cannot review your own film");
            return;
        }

        if (Date.parse(film.releaseDate) > Date.now()) {
            res.status(403).send("Forbidden. Cannot review film that hasn't released");
            return;
        }

        const reviewer = await retrieve(token.toString());

        const result = await reviews.insert(id, reviewer.id, rating, review);
        if (result.rowCount === 1) {
            res.status(201).send("Created");
            return;
        } else {
            throw new Error("Review was unable to be added to database");
        }
    } catch (err) {
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}



export { getReviews, addReview }