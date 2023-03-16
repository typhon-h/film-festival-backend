import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (
    search: string = null,
    genreIds: number[] = null,
    ageRatings: string[] = null,
    directorId: number = null,
    reviewerId: number = null,
    sortBy: string = null): Promise<FilmResult[]> => {
    Logger.info(`Getting all films that match criteria`);

    const params = [];
    const conn = await getPool().getConnection();
    let query = "select film.id as filmId, title, genre_id as genreId, age_rating as ageRating, "
        + "user.id as directorId, user.first_name as directorFirstName, user.last_name as directorLastName, cast(coalesce(rating,0) as float) as rating, release_date as releaseDate "
        + "from film inner join user on film.director_id=user.id "
        + "left outer join (select film_id, round(avg(rating),2) as rating from film_review group by film_id) as ratings on ratings.film_id=film.id  "

    if (reviewerId !== null) {
        query += " inner join  (select film_id from film_review where user_id=?) as reviews on reviews.film_id = film.id ";
        params.push(reviewerId);
    }

    query += "where 1 ";

    if (search !== null) {
        query += "and (description LIKE ? or title LIKE ?) ";
        params.push('%' + search + '%');
        params.push('%' + search + '%');
    }

    if (genreIds !== null && genreIds.length > 0) {
        query += "and genre_id in (";
        for (const id of genreIds) {
            query += (genreIds.indexOf(id) === 0 ? "?" : ",?");
            params.push(id);
        }
        query += ") ";
    }

    if (ageRatings !== null && ageRatings.length > 0) {
        query += "and age_rating in (";
        for (const rating of ageRatings) {
            query += (ageRatings.indexOf(rating) === 0 ? "?" : ",?");
            params.push(rating);
        }
        query += ") ";
    }

    if (directorId !== null) {
        query += " and director_id = ? ";
        params.push(directorId);
    }

    switch (sortBy) { // TODO: GET /films (sortBy RATING_DESC) works if secondary sort by id
        case "ALPHABETICAL_ASC":
            query += "title ASC ";
            break;
        case "ALPHABETICAL_DESC":
            query += " order by title DESC ";
            break;
        case "RELEASED_ASC":
            query += " order by release_date ASC ";
            break;
        case "RELEASED_DESC":
            query += " order by release_date DESC ";
            break;
        case "RATING_ASC":
            query += " order by rating ASC ";
            break;
        case "RATING_DESC":
            query += " order by rating DESC ";
            break;
        default: // RELEASED_ASC
            query += " order by release_date ASC ";
            break;
    }

    const [result] = await conn.query(query, params);
    await conn.release();
    return result;

}



export { getAll }