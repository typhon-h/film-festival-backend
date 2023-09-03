"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.retrieve = exports.isValidToken = exports.isAuthenticated = exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const users = __importStar(require("../models/user.server.model"));
const validator = __importStar(require("./validate.server"));
const nanoid_1 = require("nanoid");
const micro_1 = require("micro");
const bcrypt = __importStar(require("../../config/salt"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.is('application/json')) {
        req.body = (yield (0, micro_1.json)(req));
    }
    // Logger.http(`POST create a user with name: ${req.body.firstName} ${req.body.lastName}`);
    const validation = yield validator.validate(validator.schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    // Secure hashing
    const password = yield bcrypt.hash(req.body.password, bcrypt.saltRounds);
    try {
        const result = yield users.insert(email, firstName, lastName, password);
        res.status(201).send({ "userId": result.rows[0].id });
        return;
    }
    catch (err) {
        // Logger.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Email already exists";
            res.status(403).send();
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.is('application/json')) {
        req.body = (yield (0, micro_1.json)(req));
    }
    // Logger.http(`POST log in user with email: ${req.body.email}`);
    const validation = yield validator.validate(validator.schemas.user_login, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    try {
        const [userRequested] = yield users.authenticateByEmail(email);
        // If email matched AND password matches hash
        if (userRequested === undefined
            || !(yield bcrypt.compare(password, userRequested.password)).valueOf()) {
            res.status(401).send(`Not Authorized. Incorrect email/password`);
            return;
        }
        const token = (0, nanoid_1.nanoid)(64); // Unique token
        yield users.assignToken(userRequested.id, token);
        res.status(200).send({ "userId": userRequested.id, "token": token });
        return;
    }
    catch (err) {
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`POST logging out active user`);
    const activeToken = req.headers['x-authorization'];
    if (activeToken === undefined || !isValidToken(activeToken.toString())) { // Not sure if null is possible || !(await users.getTokens()).includes(activeToken.toString())
        res.status(401).send("Unauthorized. Missing authorization token");
        return;
    }
    try {
        // If null is passed through then WHERE clause defaults to false for null values
        const result = yield users.unassignToken(activeToken.toString()); // Accounts for possible list of strings
        if (result.rowCount === 0) {
            res.status(401).send("Unauthorized. Cannot logout if you are not logged in");
        }
        else {
            res.status(200).send("Logged out successfully");
        }
        return;
    }
    catch (err) {
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.logout = logout;
const view = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`GET Viewing information for user ${req.params.id}`);
    const token = req.headers['x-authorization'];
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    try {
        let authenticated = false;
        if (token !== undefined) {
            authenticated = (yield isAuthenticated(id, token.toString())).valueOf();
        }
        const [result] = yield users.getOneById(id, authenticated);
        if (result === undefined) {
            res.status(404).send(`No user with ID ${id} was found`);
        }
        else if (result.email === undefined) {
            res.status(200).send({ 'firstName': result.first_name, 'lastName': result.last_name });
        }
        else {
            res.status(200).send({ 'email': result.email, 'firstName': result.first_name, 'lastName': result.last_name });
        }
        return;
    }
    catch (err) {
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.view = view;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`PATCH updating information for user ${req.params.id}`);
    if (req.is('application/json')) {
        req.body = (yield (0, micro_1.json)(req));
    }
    const validation = yield validator.validate(validator.schemas.user_edit, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const id = parseInt(req.params.id, 10);
    const token = req.headers['x-authorization'];
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const currentPassword = req.body.currentPassword;
    let newPassword = req.body.password;
    if (isNaN(id)) {
        res.statusMessage = `Bad Request: invalid id ${req.params.id}`;
        res.status(400).send();
        return;
    }
    if (token === undefined) {
        res.status(401).send("Unauthorized.");
        return;
    }
    if ((newPassword !== undefined && currentPassword === undefined)
        || (newPassword === undefined && currentPassword !== undefined)) {
        res.status(400).send("Bad Request. Both password fields are required to update password");
        return;
    }
    try {
        if (!((yield isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. This is not your account.");
            return;
        }
        if (newPassword !== undefined) {
            const currentHash = (yield users.authenticateById(id))[0].password;
            if (!(yield bcrypt.compare(currentPassword, currentHash)).valueOf()) { // Current password wrong
                res.status(401).send("Unauthorized or invalid current password");
                return;
            }
            else if (newPassword === currentPassword) { // Same password
                res.status(403).send("Password is the same as current password");
                return;
            }
            else { // Passwords are valid
                newPassword = (yield bcrypt.hash(newPassword, bcrypt.saltRounds));
            }
        }
        const result = yield users.alter(id, email, firstName, lastName, newPassword);
        if (result.rowCount === 0) {
            res.status(404).send("User not found");
        }
        else {
            res.status(200).send("User updated successfully");
        }
        return;
    }
    catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Email already exists";
            res.status(403).send();
            return;
        }
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.update = update;
const isAuthenticated = (id, token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`Verifying active authentication for user ${id}`);
    try {
        const [result] = yield users.checkAuthentication(id, token);
        return result.id === id;
    }
    catch (err) {
        return false;
    }
});
exports.isAuthenticated = isAuthenticated;
const isValidToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`Verifying token is valid`);
    try {
        const tokens = yield users.getTokens();
        for (const t of tokens) {
            if (token === t.auth_token) {
                return true;
            }
        }
        return false;
    }
    catch (err) {
        // Logger.error(err);
        return false;
    }
});
exports.isValidToken = isValidToken;
const retrieve = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http("Retrieving user by token");
    try {
        const [result] = yield users.getOneByToken(token);
        return result;
    }
    catch (err) {
        // Logger.error(err);
        return undefined;
    }
});
exports.retrieve = retrieve;
//# sourceMappingURL=user.server.controller.js.map