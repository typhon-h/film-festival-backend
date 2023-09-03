"use strict";
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
exports.insert = exports.getAll = void 0;
const postgres_1 = require("@vercel/postgres");
const logger_1 = __importDefault(require("../../config/logger"));
const getAll = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting all films that match criteria`);
    const result = yield (0, postgres_1.sql) `select film_id, user.id as reviewerId, user.first_name as reviewerFirstName,
         user.last_name as reviewerLastName,rating, review, timestamp
         from film_review join user on user.id = film_review.user_id where film_id = ${id}
         order by timestamp desc`;
    return result.rows.map((row) => {
        const review = {
            reviewerId: row.reviewerId,
            rating: row.rating,
            review: row.review,
            reviewerFirstName: row.reviewerFirstName,
            reviewerLastName: row.reviewerLastName,
            timestamp: row.timestamp,
        };
        return review;
    });
});
exports.getAll = getAll;
const insert = (filmId, userId, rating, review) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding review by user ${userId} for film ${filmId}`);
    if (review === undefined) {
        review = null;
    }
    const result = yield (0, postgres_1.sql) `insert into film_review (film_id, user_id, rating, review)
        values (${filmId},${userId},${rating},${review})`;
    return result;
});
exports.insert = insert;
//# sourceMappingURL=film.review.server.model.js.map