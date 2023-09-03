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
exports.addReview = exports.getReviews = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const reviews = __importStar(require("../models/film.review.server.model"));
const film_server_model_1 = require("../models/film.server.model");
const validator = __importStar(require("./validate.server"));
const user_server_controller_1 = require("./user.server.controller");
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET all reviews for film ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    try {
        const film = yield (0, film_server_model_1.getOne)(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film found with id ${id}`);
            return;
        }
        const result = yield reviews.getAll(id);
        if (result !== undefined) {
            res.status(200).send(result);
            return;
        }
        else {
            throw new Error(`Reviews could not be retrieved`);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getReviews = getReviews;
const addReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`POST create a review for film: ${req.params.id}`);
    const validation = yield validator.validate(validator.schemas.film_review_post, req.body);
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
        if (token === undefined || !((yield (0, user_server_controller_1.isValidToken)(token.toString())).valueOf())) {
            res.status(401).send("Unauthorized. You must be a registered user");
            return;
        }
        const [film] = yield (0, film_server_model_1.getOne)(id);
        if (film === undefined) {
            res.status(404).send(`Not Found. No film found with id ${id}`);
            return;
        }
        if ((yield (0, user_server_controller_1.isAuthenticated)(film.directorId, token.toString())).valueOf()) {
            res.status(403).send("Forbidden. Cannot review your own film");
            return;
        }
        if (Date.parse(film.releaseDate) > Date.now()) {
            res.status(403).send("Forbidden. Cannot review film that hasn't released");
            return;
        }
        const reviewer = yield (0, user_server_controller_1.retrieve)(token.toString());
        const result = yield reviews.insert(id, reviewer.id, rating, review);
        if (result.rowCount === 1) {
            res.status(201).send("Created");
            return;
        }
        else {
            throw new Error("Review was unable to be added to database");
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addReview = addReview;
//# sourceMappingURL=film.review.server.controller.js.map