import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';


const getOne = async (id: number): Promise<Image[]> => { // Image type from User types
    Logger.info(`Retrieving filepath for profile picture of user ${id}`);
    const conn = await getPool().getConnection();
    const query = "select image_filename from film where id = ?";
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;
};

const alter = async (id: number, filename: string): Promise<ResultSetHeader> => {
    Logger.info(`Updating hero image for film ${id}`);
    const conn = await getPool().getConnection();
    const query = "update film set image_filename = ? where id = ?";
    const [result] = await conn.query(query, [filename, id]);
    await conn.release();
    return result;
}

export { getOne, alter }