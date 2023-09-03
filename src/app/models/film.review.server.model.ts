import { QueryResult, sql } from '@vercel/postgres';
import Logger from '../../config/logger';

const getAll = async (id: number): Promise<Review[]> => {
    Logger.info(`Getting all films that match criteria`);

    const result = await sql`select film_id, user.id as reviewerId, user.first_name as reviewerFirstName,
         user.last_name as reviewerLastName,rating, review, timestamp
         from film_review join user on user.id = film_review.user_id where film_id = ${id}
         order by timestamp desc`;
    return result.rows.map((row) => {
        const review: Review = {
            reviewerId: row.reviewerId,
            rating: row.rating,
            review: row.review,
            reviewerFirstName: row.reviewerFirstName,
            reviewerLastName: row.reviewerLastName,
            timestamp: row.timestamp,
        };
        return review;
    });
}

const insert = async (
    filmId: number,
    userId: number,
    rating: number,
    review: string): Promise<QueryResult> => {
    Logger.info(`Adding review by user ${userId} for film ${filmId}`);

    if (review === undefined) {
        review = null;
    }
    const result = await sql`insert into film_review (film_id, user_id, rating, review)
        values (${filmId},${userId},${rating},${review})`;

    return result;
}

export { getAll, insert }