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

const authenticateByEmail = async (
    email: string): Promise<AuthenticateRequest[]> => {
    Logger.info(`Authenticating user with email ${email}`);
    const conn = await getPool().getConnection();
    const query = "select id, password from user "
        + " where email = ?";
    const [result] = await conn.query(query, [email]);
    await conn.release();
    return result;
};

const authenticateById = async (
    id: number): Promise<AuthenticateRequest[]> => {
    Logger.info(`Authenticating user with id ${id}`);
    const conn = await getPool().getConnection();
    const query = "select id, password from user "
        + " where id = ?";
    const [result] = await conn.query(query, [id]);
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

const unassignToken = async (token: string): Promise<ResultSetHeader> => {
    Logger.info(`Unassigning active user token`);
    const conn = await getPool().getConnection();
    const query = "update user set auth_token = null where auth_token = ?";
    const [result] = await conn.query(query, [token]);
    await conn.release();
    return result;
};

const checkAuthentication = async (id: number, token: string): Promise<AuthenticateRequest[]> => {
    Logger.info(`Checking if user ${id} is currently authenticated`);
    const conn = await getPool().getConnection();
    const query = "select id from user where auth_token = ? and id = ?";
    const [result] = await conn.query(query, [token, id]);
    return result;
}

const getTokens = async (): Promise<Token[]> => { // TODO: tidy typing
    Logger.info(`Retrieving all active tokens`);
    const conn = await getPool().getConnection();
    const query = "select auth_token from user where auth_token is not null";
    const [result] = await conn.query(query);
    return result;
}

const getOneById = async (id: number, authenticated: boolean = false): Promise<User[]> => {
    Logger.info(`Getting user id: ${id}. Authenticated: ${authenticated}`);
    const conn = await getPool().getConnection();
    const query = "select id, first_name, last_name "
        + (authenticated ? ", email" : "")
        + " from user where id = ?";
    const [result] = await conn.query(query, id);
    await conn.release();
    return result;
}

const getOneByToken = async (token: string): Promise<User[]> => {
    Logger.info(`Getting user by token.`);
    const conn = await getPool().getConnection();
    const query = "select id, first_name, last_name " // TODO: consider returning email as token = authorized
        + " from user where auth_token = ?";
    const [result] = await conn.query(query, token);
    await conn.release();
    return result;
}

const alter = async (id: number, email: string, firstName: string, lastName: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Altering user ${id}`);
    const conn = await getPool().getConnection();
    const params = [];
    let query = "update user set ";

    if (email !== undefined) {
        query += "email = ? ";
        params.push(email);
    }

    if (firstName !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += "first_name = ? ";
        params.push(firstName);
    }

    if (lastName !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += "last_name = ? ";
        params.push(lastName);
    }

    if (password !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += "password = ? ";
        params.push(password);
    }
    query += "where id = ?";
    params.push(id);

    const [result] = await conn.query(query, params);
    await conn.release();
    return result;
}




export {
    insert,
    authenticateByEmail,
    authenticateById,
    assignToken,
    unassignToken,
    checkAuthentication,
    getTokens,
    getOneById,
    getOneByToken,
    alter
}