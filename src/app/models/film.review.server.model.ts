import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (id: number): Promise<Review[]> => {
    Logger.info(`Getting all films that match criteria`);

    const conn = await getPool().getConnection();
    const query = "select film_id, user.id as reviewerId, user.first_name as reviewerFirstName, "
        + " user.last_name as reviewerLastName,rating, review, timestamp "
        + " from film_review join user on user.id = film_review.user_id where film_id = ? "
        + " order by timestamp desc";

    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;

}

const insert = async (
    filmId: number,
    userId: number,
    rating: number,
    review: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding review by user ${userId} for film ${filmId}`);

    const conn = await getPool().getConnection();
    const query = "insert into film_review (film_id, user_id, rating, review) "
        + " values (?,?,?,?)";
    if (review === undefined) {
        review = null;
    }
    const [result] = await conn.query(query, [filmId, userId, rating, review]);
    await conn.release();
    return result;
}

export { getAll, insert }