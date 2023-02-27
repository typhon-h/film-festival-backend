import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const insert = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} ${lastName} to the database`);
    const conn = await getPool().getConnection();
    const query = "insert into user (email, first_name, last_name, password) " +
        "values ( ?, ?, ?, ?)";
    const [result] = await conn.query(query, [email, firstName, lastName, password]);
    await conn.release();
    return result;
};


export { insert }