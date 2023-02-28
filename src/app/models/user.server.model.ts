import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const insert = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${firstName} ${lastName} to the database`);
    const conn = await getPool().getConnection();



    const query = "insert into user (email, first_name, last_name, password) "
        + "values ( ?, ?, ?, ?)";
    const [result] = await conn.query(query, [email, firstName, lastName, password]);
    await conn.release();
    return result;
};

const authenticationRequest = async (
    email: string,
    password: string): Promise<AuthenticateRequest[]> => {
    Logger.info(`Authenticating email ${email}`);
    const conn = await getPool().getConnection();
    const query = "select id, password from user "
        + " where email = ?";
    const [result] = await conn.query(query, [email, password]);
    await conn.release();
    return result;
};

const assignToken = async (
    id: number,
    token: string): Promise<ResultSetHeader> => {
    Logger.info(`Assigning token to user ${id}`);
    const conn = await getPool().getConnection();
    const query = "update user set auth_token = ? where id = ?";
    const [result] = await conn.query(query, [token, id]);
    await conn.release();
    return result;
};


export { insert, authenticationRequest, assignToken }