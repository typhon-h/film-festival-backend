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
exports.getAllGenres = exports.remove = exports.update = exports.insert = exports.getOne = exports.getAll = void 0;
const postgres_1 = require("@vercel/postgres");
const postgres_2 = require("@vercel/postgres");
const logger_1 = __importDefault(require("../../config/logger"));
const getAll = (search = null, genreIds = null, ageRatings = null, directorId = null, reviewerId = null, sortBy = null) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting all films that match criteria`);
    const params = [];
    let query = `select film.id as "filmId", title, genre_id as "genreId", age_rating as "ageRating",
       "user".id as "directorId", "user".first_name as "directorFirstName", "user".last_name as "directorLastName", COALESCE(rating, 0.0) as "rating", release_date as "releaseDate"
        from film
        inner join "user" on film.director_id = "user".id
        left outer join (
            select film_id, ROUND(AVG(rating), 2) as rating
            from film_review
            group by film_id
        ) as ratings on ratings.film_id = film.id `;
    if (reviewerId !== null) {
        query += ` inner join  (select film_id from film_review where user_id=${reviewerId}) as reviews on reviews.film_id = film.id `;
        params.push(reviewerId);
    }
    query += "where true ";
    if (search !== null) {
        query += `and (description LIKE '%${search}%' or title LIKE '%${search}%') `;
    }
    if (genreIds !== null && genreIds.length > 0) {
        query += `and genre_id in (`;
        for (const id of genreIds) {
            query += (genreIds.indexOf(id) === 0 ? `${id}` : `,${id}`); // TODO: fix duplicate id
        }
        query += ") ";
    }
    if (ageRatings !== null && ageRatings.length > 0) {
        query += "and age_rating in (";
        for (const rating of ageRatings) {
            query += (ageRatings.indexOf(rating) === 0 ? `'${rating}'` : `,'${rating}'`);
        }
        query += `) `;
    }
    if (directorId !== null) {
        query += ` and director_id = ${directorId} `;
    }
    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            query += ` order by title ASC `;
            break;
        case "ALPHABETICAL_DESC":
            query += ` order by title DESC `;
            break;
        case "RELEASED_ASC":
            query += ` order by release_date ASC `;
            break;
        case "RELEASED_DESC":
            query += ` order by release_date DESC `;
            break;
        case "RATING_ASC":
            query += ` order by rating ASC `;
            break;
        case "RATING_DESC":
            query += ` order by rating DESC `;
            break;
        default: // RELEASED_ASC
            query += ` order by release_date ASC `;
            break;
    }
    query += ` , film.id ASC`; // id secondary sort
    const conn = yield postgres_2.db.connect();
    const result = yield conn.query(query);
    return result.rows.map((row) => {
        const film = {
            filmId: row.filmId,
            title: row.title,
            genreId: row.genreId,
            ageRating: row.ageRating,
            directorId: row.directorId,
            directorFirstName: row.directorFirstName,
            directorLastName: row.directorLastName,
            rating: row.rating,
            releaseDate: row.releaseDate,
        };
        return film;
    });
});
exports.getAll = getAll;
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting film ${id}`);
    const result = yield (0, postgres_1.sql) `SELECT
    film.id AS "filmId",
    film.title,
    film.description,
    film.runtime,
    film.genre_id AS "genreId",
    film.age_rating AS "ageRating",
    film.release_date AS "releaseDate",
    "user".id AS "directorId",
    "user".first_name AS "directorFirstName",
    "user".last_name AS "directorLastName",
    CAST(COALESCE(rating, 0) AS FLOAT) AS "rating",
    COALESCE(numReviews, 0) AS "numReviews",
    film.image_filename
FROM
    film
INNER JOIN
    "user"
ON
    film.director_id = "user".id
LEFT OUTER JOIN
    (SELECT film_id, ROUND(AVG(rating), 2) AS rating FROM film_review GROUP BY film_id) AS ratings
ON
    ratings.film_id = film.id
LEFT OUTER JOIN
    (SELECT film_id, COUNT(*) AS numReviews FROM film_review GROUP BY film_id) AS reviews
ON
    reviews.film_id = film.id
WHERE
    film.id = ${id};
`;
    return result.rows.map((row) => {
        const film = {
            filmId: row.filmId,
            title: row.title,
            description: row.description,
            genreId: row.genreId,
            directorId: row.directorId,
            directorFirstName: row.directorFirstName,
            directorLastName: row.directorLastName,
            releaseDate: row.releaseDate,
            ageRating: row.ageRating,
            runtime: row.runtime,
            rating: row.rating,
            numReviews: row.numReviews,
            image_filename: row.image_filename,
        };
        return film;
    });
});
exports.getOne = getOne;
const insert = (title, description, releaseDate, genreId, runtime, ageRating, director) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Inserting film ${title}`);
    const query = `insert into film (title, description, genre_id, runtime, director_id, release_date
        ${(ageRating !== undefined ? ', age_rating' : '')}
        )
         values('${title}','${description}',${genreId},${runtime},${director}
        ${(releaseDate !== undefined ? `,'${releaseDate}'` : `,now()`)}
        ${(ageRating !== undefined ? `,'${ageRating}'` : "")}
        ) returning *`;
    logger_1.default.info(query);
    const conn = yield postgres_2.db.connect();
    const result = yield conn.query(query);
    return result;
});
exports.insert = insert;
const update = (id, title, description, genreId, runtime, ageRating, releaseDate) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating film ${title} `);
    const params = []; // left in to maintain param count bc I'm lazy
    let query = "update film set ";
    if (title !== undefined) {
        query += ` title = '${title}' `;
        params.push(title);
    }
    if (description !== undefined) {
        query += (params.length > 0 ? "," : "") + ` description = '${description}' `;
        params.push(description);
    }
    if (genreId !== undefined) {
        query += (params.length > 0 ? "," : "") + ` genre_id = ${genreId} `;
        params.push(genreId);
    }
    if (runtime !== undefined) {
        query += (params.length > 0 ? "," : "") + ` runtime = ${runtime} `;
        params.push(runtime);
    }
    if (ageRating !== undefined) {
        query += (params.length > 0 ? "," : "") + ` age_rating = '${ageRating}' `;
        params.push(ageRating);
    }
    if (releaseDate !== undefined) {
        query += (params.length > 0 ? "," : "") + ` release_date = '${releaseDate}' `;
        params.push(releaseDate);
    }
    query += `where id = ${id} `;
    const conn = yield postgres_2.db.connect();
    const result = yield conn.query(query);
    return result;
});
exports.update = update;
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Deleting film id ${id} `);
    const result = yield (0, postgres_1.sql) `delete from film where id = ${id} `;
    return result;
});
exports.remove = remove;
const getAllGenres = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Retrieving all genres`);
    const result = yield (0, postgres_1.sql) `select id as "genreId", name from genre`;
    return result.rows.map((row) => {
        const genre = {
            genreId: row.genreId,
            name: row.name,
        };
        return genre;
    });
});
exports.getAllGenres = getAllGenres;
//# sourceMappingURL=film.server.model.js.map