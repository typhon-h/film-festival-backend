import { QueryResult, sql } from '@vercel/postgres';
import Logger from '../../config/logger';


const getOne = async (id: number): Promise<Image[]> => {
    // Logger.info(`Retrieving filepath for profile picture of user ${id}`);
    const result = await sql`select image_filename from user where id = ${id}`;

    return result.rows.map((row) => {
        const image: Image = {
            image_filename: row.image_filename,
        };
        return image;
    });
};

const alter = async (id: number, filename: string): Promise<QueryResult> => {
    // Logger.info(`Updating profile image for user ${id}`);

    const result = await sql`update user set image_filename = ${filename} where id = ${id}`;

    return result;
}

const remove = async (id: number): Promise<QueryResult> => {
    // Logger.info(`Removing profile image for user  ${id}`);
    const result = await sql`update user set image_filename = null where id = ${id}`;

    return result;
}

export { getOne, alter, remove }