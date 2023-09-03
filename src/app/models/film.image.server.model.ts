import { QueryResult, sql } from '@vercel/postgres';
import Logger from '../../config/logger';

const getOne = async (id: number): Promise<Image[]> => { // Image type from User types
    Logger.info(`Retrieving filepath for profile picture of user ${id}`);
    const result = await sql`select image_filename from film where id = ${id}`;
    return result.rows.map((row) => {
        const image: Image = {
            image_filename: row.image_filename,
        };
        return image;
    })
};

const alter = async (id: number, filename: string): Promise<QueryResult> => {
    Logger.info(`Updating hero image for film ${id}`);
    const result = await sql`update film set image_filename = ${filename} where id = ${id}`;
    return result;
}

export { getOne, alter }