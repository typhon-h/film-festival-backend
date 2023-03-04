import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';


const getImage = async (id: number): Promise<Image[]> => {
    Logger.info(`Retrieving filepath for profile picture of user ${id}`);
    const conn = await getPool().getConnection();
    const query = "select image_filename from user where id = ?";
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;
};



export { getImage }