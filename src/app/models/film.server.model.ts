import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';


const getAll = async (
    search: string = null,
    genreIds: Array<number> = null,
    ageRatings: Array<string> = null,
    directorId: number = null,
    reviewerId: number = null,
    sortBy: string = null
): Promise<Film[]> => {
    Logger.info(`Getting all films that match criteria`);
    const conn = await getPool().getConnection();
    let query = "select * from film where 1 ";
    let params = [];

    if (search !== null) {
        query += "and (description LIKE '%?%' or title LIKE '%?%') ";
        params.push(search);
        params.push(search);
    }

    if (genreIds !== null && genreIds.length > 0) {
        query += "and genre_id in (";
        for (let id of genreIds) {
            query += (genreIds.indexOf(id) == 0 ? "?" : ",?");
            params.push(id);
        }
        query += ") ";
    }

    if (ageRatings !== null && ageRatings.length > 0) {
        query += "and age_rating in (";
        for (let rating of ageRatings) {
            query += (ageRatings.indexOf(rating) == 0 ? "?" : ",?");
            params.push(rating);
        }
        query += ") ";
    }

    if (directorId != null) {
        query += " and director_id = ? ";
        params.push(directorId);
    }

    if (reviewerId != null) {
        query += " and reviewer_id = ? ";
        params.push(reviewerId);
    }

    if (sortBy != null) {
        query += " order by ?";
        params.push(sortBy);
    } else {
        query += " order by release_date ASC";
    }

    const [result] = await conn.query(query, params);
    await conn.release();
    return result;

}



export { getAll }