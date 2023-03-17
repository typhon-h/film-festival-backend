import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as reviews from "../models/film.review.server.model";
import { getOne } from "../models/film.server.model";


const getReviews = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET all reviews for film ${req.params.id}`);

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
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
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



export { getReviews, addReview }