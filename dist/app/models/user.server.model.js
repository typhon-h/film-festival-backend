"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alter = exports.getOneByToken = exports.getOneById = exports.getTokens = exports.checkAuthentication = exports.unassignToken = exports.assignToken = exports.authenticateById = exports.authenticateByEmail = exports.insert = void 0;
const postgres_1 = require("@vercel/postgres");
const postgres_2 = require("@vercel/postgres");
const insert = (email, firstName, lastName, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Adding user ${firstName} ${lastName} to the database`);
    const result = yield (0, postgres_1.sql) `insert into "user" (email, first_name, last_name, password)
  values ( ${email}, ${firstName}, ${lastName}, ${password}) returning *`;
    return result;
});
exports.insert = insert;
const authenticateByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Authenticating user with email ${email}`);
    const result = yield (0, postgres_1.sql) `select id, password from "user"
        where email = ${email}`;
    return result.rows.map((row) => {
        const request = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
});
exports.authenticateByEmail = authenticateByEmail;
const authenticateById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Authenticating user with id ${id}`);
    const result = yield (0, postgres_1.sql) `select id, password from "user"
         where id = ${id}`;
    return result.rows.map((row) => {
        const request = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
});
exports.authenticateById = authenticateById;
const assignToken = (id, token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Assigning token to user ${id}`);
    const result = yield (0, postgres_1.sql) `update "user" set auth_token = ${token} where id = ${id}`;
    return result;
});
exports.assignToken = assignToken;
const unassignToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Unassigning active user token`);
    const result = yield (0, postgres_1.sql) `update "user" set auth_token = null where auth_token = ${token}`;
    return result;
});
exports.unassignToken = unassignToken;
const checkAuthentication = (id, token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Checking if user ${id} is currently authenticated`);
    const result = yield (0, postgres_1.sql) `select id from "user" where auth_token = ${token} and id = ${id}`;
    return result.rows.map((row) => {
        const request = {
            id: row.id,
            password: row.password,
        };
        return request;
    });
});
exports.checkAuthentication = checkAuthentication;
const getTokens = () => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Retrieving all active tokens`);
    const result = yield (0, postgres_1.sql) `select auth_token from "user" where auth_token is not null`;
    return result.rows.map((row) => {
        const token = {
            auth_token: row.auth_token,
        };
        return token;
    });
});
exports.getTokens = getTokens;
const getOneById = (id, authenticated = false) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Getting user id: ${id}. Authenticated: ${authenticated}`)
    const query = `
        SELECT id, first_name, last_name
        ${(authenticated ? ', email' : '')}
        FROM "user"
        WHERE id = ${id}`;
    const conn = yield postgres_2.db.connect();
    const result = yield conn.query(query);
    return result.rows.map((row) => {
        const user = {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
        };
        return user;
    });
});
exports.getOneById = getOneById;
const getOneByToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Getting user by token.`);
    // TODO: consider returning email as token = authorized
    const result = yield (0, postgres_1.sql) `select id, first_name, last_name
         from "user" where auth_token = ${token}`;
    return result.rows.map((row) => {
        const user = {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
        };
        return user;
    });
});
exports.getOneByToken = getOneByToken;
const alter = (id, email, firstName, lastName, password) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Altering user ${id}`);
    const params = []; // Keeping to count params bc I'm lazy
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
    const conn = yield postgres_2.db.connect();
    const result = yield conn.query(query);
    return result;
});
exports.alter = alter;
//# sourceMappingURL=user.server.model.js.map