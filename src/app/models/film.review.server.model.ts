import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (id: number): Promise<Review[]> => {
    Logger.info(`Getting all films that match criteria`);

    const conn = await getPool().getConnection();
    const query = "select film_id, user.id as reviewerId, user.first_name as reviewerFirstName, user.last_name as reviewerLastName,rating, review, timestamp "
        + " from film_review join user on user.id = film_review.user_id where film_id = ?";

    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;

}

export { getAll }