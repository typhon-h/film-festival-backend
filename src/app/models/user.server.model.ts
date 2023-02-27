import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const insert = async (
    email: String,
    first_name: String,
    last_name: String,
    image_filename: String,
    password: String,
    auth_token: String): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${first_name} ${last_name} to the database`);
    const conn = await getPool().getConnection();
    const query = "insert into user (email, first_name, last_name, image_filename, password, auth_token) " +
        "values ( ?, ?, ?, ?, ?, ?)";
    const [result] = await conn.query(query, [email, first_name, last_name,
        image_filename, password, auth_token]);
    await conn.release();
    return result;
};


export { insert }