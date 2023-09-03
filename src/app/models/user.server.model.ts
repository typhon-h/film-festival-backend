import { QueryResult, sql } from '@vercel/postgres';
import { db } from '@vercel/postgres';

import Logger from '../../config/logger';

const insert = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string): Promise<QueryResult> => {
    Logger.info(`Adding user ${firstName} ${lastName} to the database`);

    const result = await sql`insert into "user" (email, first_name, last_name, password)
  values ( ${email}, ${firstName}, ${lastName}, ${password}) returning *`
    return result;
};

const authenticateByEmail = async (
    email: string): Promise<AuthenticateRequest[]> => {
    Logger.info(`Authenticating user with email ${email}`);
    const result = await sql`select id, password from "user"
        where email = ${email}`;

    return result.rows.map((row) => {
        const request: AuthenticateRequest = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
};

const authenticateById = async (
    id: number): Promise<AuthenticateRequest[]> => {
    Logger.info(`Authenticating user with id ${id}`);

    const result = await sql`select id, password from "user"
         where id = ${id}`;

    return result.rows.map((row) => {
        const request: AuthenticateRequest = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
};

const assignToken = async (
    id: number,
    token: string): Promise<QueryResult> => {
    Logger.info(`Assigning token to user ${id}`);

    const result = await sql`update "user" set auth_token = ${token} where id = ${id}`;

    return result;
};

const unassignToken = async (token: string): Promise<QueryResult> => {
    Logger.info(`Unassigning active user token`);
    const result = await sql`update "user" set auth_token = null where auth_token = ${token}`;
    return result;
};

const checkAuthentication = async (id: number, token: string): Promise<AuthenticateRequest[]> => {
    Logger.info(`Checking if user ${id} is currently authenticated`);
    const result = await sql`select id from "user" where auth_token = ${token} and id = ${id}`;
    return result.rows.map((row) => {
        const request: AuthenticateRequest = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
}

const getTokens = async (): Promise<Token[]> => { // TODO: tidy typing
    Logger.info(`Retrieving all active tokens`);
    const result = await sql`select auth_token from "user" where auth_token is not null`;
    return result.rows.map((row) => {
        const token: Token = {
            auth_token: row.auth_token,
        };
        return token;
    });
}

const getOneById = async (id: number, authenticated: boolean = false): Promise<User[]> => {
    Logger.info(`Getting user id: ${id}. Authenticated: ${authenticated}`)
    const query = `
        SELECT id, first_name, last_name
        ${(authenticated ? ', email' : '')}
        FROM "user"
        WHERE id = ${id}`;

    const conn = await db.connect();
    const result = await conn.query(query)

    return result.rows.map((row) => {
        const user: User = {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
        };
        return user;
    });
}

const getOneByToken = async (token: string): Promise<User[]> => {
    Logger.info(`Getting user by token.`);
    // TODO: consider returning email as token = authorized
    const result = await sql`select id, first_name, last_name
         from "user" where auth_token = ${token}`;

    return result.rows.map((row) => {
        const user: User = {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
        };
        return user;
    });
}

const alter = async (id: number, email: string, firstName: string, lastName: string, password: string): Promise<QueryResult> => {
    Logger.info(`Altering user ${id}`);

    const params = [];  // Keeping to count params bc I'm lazy
    let query = `update "user" set `;

    if (email !== undefined) {
        query += `email = '${email}' `;
        params.push(email);
    }

    if (firstName !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += `first_name = '${firstName}' `;
        params.push(firstName);
    }

    if (lastName !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += `last_name = '${lastName}' `;
        params.push(lastName);
    }

    if (password !== undefined) {
        query += (params.length > 0 ? "," : "");
        query += `password = '${password}' `;
        params.push(password);
    }
    query += `where id = ${id}`;
    params.push(id);

    const conn = await db.connect()
    const result = await conn.query(query);

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