"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasReviews = exports.getGenres = exports.deleteOne = exports.editOne = exports.addOne = exports.getOne = exports.viewAll = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const validator = __importStar(require("./validate.server"));
const films = __importStar(require("../models/film.server.model"));
const user_server_controller_1 = require("./user.server.controller");
const film_review_server_model_1 = require("../models/film.review.server.model");
const path = require("path");
const filesystem = require("fs");
const fs = filesystem.promises;
const filepath = path.resolve('storage/images') + '/';
const viewAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET all films that match body criteria`);
    const validation = yield validator.validate(validator.schemas.film_search, req.query);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const search = (req.query.q !== undefined ? req.query.q.toString() : undefined);
    const directorId = (req.query.directorId !== undefined ? parseInt(req.query.directorId.toString(), 10) : undefined);
    const reviewerId = (req.query.reviewerId !== undefined ? parseInt(req.query.reviewerId.toString(), 10) : undefined);
    const sort = (req.query.sortBy !== undefined ? req.query.sortBy : undefined);
    let genreIds;
    if (Array.isArray(req.query.genreIds)) {
        genreIds = req.query.genreIds.map((str) => {
            return parseInt(str.toString(), 10);
        });
    }
    else if (req.query.genreIds !== undefined) {
        genreIds = [parseInt(req.query.genreIds, 10)];
    }
    let ageRatings;
    if (Array.isArray(req.query.ageRatings)) {
        ageRatings = req.query.ageRatings.map((str) => {
            return str.toString();
        });
    }
    else if (req.query.ageRatings !== undefined) {
        ageRatings = [req.query.ageRatings.toString()];
    }
    try {
        if (genreIds !== undefined && !(yield genreExists(genreIds)).valueOf()) {
            res.status(400).send("Genre does not exist");
            return;
        }
        const result = yield films.getAll(search, genreIds, ageRatings, directorId, reviewerId, sort);
        const startIndex = (req.query.startIndex !== undefined ? parseInt(req.query.startIndex.toString(), 10) : undefined);
        const count = (req.query.count !== undefined ? parseInt(req.query.count.toString(), 10) : result.length);
        let end;
        if (startIndex === undefined && count !== 0) {
            end = count;
        }
        else if (count === 0) {
            end = result.length;
        }
        else {
            end = startIndex + count; // TODO: FIX
        }
        res.status(200).send({ "films": result.slice(startIndex, end), "count": result.length });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.viewAll = viewAll;
const getOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET Film with id: ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { // TODO: Should really be validated with ajv but appears to use this method on deployed server
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    try {
        const [result] = yield films.getOne(id);
        if (result !== undefined) {
            delete result.image_filename;
            res.status(200).send(result);
        }
        else {
            res.status(404).send(`No film with id: ${id} found`);
        }
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getOne = getOne;
const addOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`POST adding new film ${req.body.title}`);
    const validation = yield validator.validate(validator.schemas.film_post, req.body);
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
        if (token === undefined || !((yield (0, user_server_controller_1.isValidToken)(token.toString())).valueOf())) {
            res.status(401).send("Unauthorized. You must be a registered user");
            return;
        }
        if (releaseDate !== undefined && Date.parse(releaseDate) < Date.now()) {
            res.status(403).send("Forbidden. Cannot release film in the past");
            return;
        }
        if (!(yield genreExists([genreId])).valueOf()) {
            res.status(400).send(`Genre id ${genreId} does not exist`);
            return;
        }
        const director = (yield (0, user_server_controller_1.retrieve)(token.toString())).id;
        const result = yield films.insert(title, description, releaseDate, genreId, runtime, ageRating, director);
        res.status(201).send({ "filmId": result.rows[0].id });
        return;
    }
    catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Forbidden. Film title is not unique";
            res.status(403).send();
            return;
        }
        else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
            res.status(400).send("Incorrect datetime value");
            return;
        }
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addOne = addOne;
const editOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`PATCH editing film ${req.params.id}`);
    const validation = yield validator.validate(validator.schemas.film_patch, req.body);
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
        if (token === undefined || !(yield (0, user_server_controller_1.isValidToken)(token.toString()))) {
            res.status(401).send("Unauthorized");
            return;
        }
        if (genreId !== undefined && !(yield genreExists([genreId])).valueOf()) {
            res.status(400).send(`Genre id ${genreId} does not exist`);
            return;
        }
        const [film] = yield films.getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film with id ${id}`);
            return;
        }
        const director = yield (0, user_server_controller_1.retrieve)(token.toString());
        if (film.directorId !== director.id) {
            res.status(403).send("Forbidden. Only the director can delete a film");
            return;
        }
        if (releaseDate !== undefined && Date.parse(film.releaseDate) < Date.now()) {
            res.status(403).send("Forbidden. Release date cannot be changed after it has passed");
            return;
        }
        if ((yield hasReviews(film.filmId)).valueOf()) {
            res.status(403).send("Forbidden. Film cannot be edited after it has been reviewed");
            return;
        }
        const result = yield films.update(film.filmId, title, description, genreId, runtime, ageRating, releaseDate);
        if (result.rowCount === 1) {
            res.status(200).send(`OK`);
            return;
        }
        else {
            res.status(404).send(`Film ${title} Not Found`);
            return;
        }
    }
    catch (err) {
        if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
            res.status(400).send("Incorrect datetime value");
            return;
        }
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.editOne = editOne;
const deleteOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`DELETE Removing film ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    const token = req.headers['x-authorization'];
    if (isNaN(id)) { // TODO: Should really be validated with ajv but appears to use this method on deployed server
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    try {
        if (token === undefined || !(yield (0, user_server_controller_1.isValidToken)(token.toString()))) {
            res.status(401).send("Unauthorized");
            return;
        }
        const [film] = yield films.getOne(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film with id ${id}`);
            return;
        }
        const director = yield (0, user_server_controller_1.retrieve)(token.toString());
        if (film.directorId !== director.id) {
            res.status(403).send("Forbidden. Only the director can delete a film");
            return;
        }
        const result = yield films.remove(film.filmId);
        if (result.rowCount === 1) {
            if (film.image_filename !== null) { // TODO: CHECK THIS WHEN FILM IMAGES EXIST
                yield fs.unlink(filepath + film.image_filename);
            }
            res.status(200).send("OK");
            return;
        }
        else {
            throw new Error(`Could not delete film`);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteOne = deleteOne;
const getGenres = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET all genres`);
    try {
        const result = yield films.getAllGenres();
        if (result !== undefined) {
            res.status(200).send(result);
            return;
        }
        else {
            throw new Error(`Could not retrieve genres`);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getGenres = getGenres;
const genreExists = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if genres exist: ${ids}`);
    try {
        const genres = yield films.getAllGenres();
        for (const id of ids) {
            const matches = genres.filter((genre) => {
                return genre.genreId === id;
            });
            if (matches.length === 0) {
                return false;
            }
        }
        return true;
    }
    catch (err) {
        logger_1.default.error(err);
        return false;
    }
});
const hasReviews = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, film_review_server_model_1.getAll)(id); // Reviews
        return result !== undefined && result.length > 0;
    }
    catch (err) {
        logger_1.default.error(err);
        return true; // TODO: safer to assume there is a review on error?
    }
});
exports.hasReviews = hasReviews;
//# sourceMappingURL=film.server.controller.js.map