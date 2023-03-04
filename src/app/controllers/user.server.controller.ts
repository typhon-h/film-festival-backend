import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import * as validator from './validate.server';
import { nanoid } from 'nanoid';
import * as bcrypt from "../../config/salt";

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with name: ${req.body.firstName} ${req.body.lastName}`);
    const validation = await validator.validate(
        validator.schemas.user_register,
        req.body
    );

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    // Secure hashing
    const password = await bcrypt.hash(req.body.password, bcrypt.saltRounds);


    try {
        const result = await users.insert(email, firstName, lastName, password);
        res.status(201).send({ "userId": result.insertId });
        return;
    } catch (err) {
        Logger.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Email already exists";
            res.status(403).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST log in user with email: ${req.body.email}`);
    const validation = await validator.validate(
        validator.schemas.user_login,
        req.body
    );

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const email = req.body.email;
    const password = req.body.password;

    try {
        const [userRequested] = await users.authenticateByEmail(email);

        // If email matched AND password matches hash
        if (userRequested === undefined
            || !(await bcrypt.compare(password, userRequested.password)).valueOf()) {
            res.status(401).send(`Not Authorized. Incorrect email/password`);
            return;
        }

        const token = nanoid(64); // Unique token
        await users.assignToken(userRequested.id, token);

        res.status(200).send({ "userId": userRequested.id, "token": token });

        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST logging out active user`);

    const activeToken = req.headers['x-authorization'];
    if (activeToken === undefined) { // Not sure if null is possible
        res.status(401).send("Unauthorized. Missing authorization token");
        return;
    }
    try {
        // If null is passed through then WHERE clause defaults to false for null values
        const result = await users.unassignToken(activeToken.toString()); // Accounts for possible list of strings
        if (result.affectedRows === 0) {
            res.status(401).send("Unauthorized. Cannot logout if you are not logged in");
        } else {
            res.status(200).send("Logged out successfully");
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET Viewing information for user ${req.params.id}`);

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
            authenticated = (await isAuthenticated(id, token.toString())).valueOf();
        }

        const [result] = await users.getOne(id, authenticated);

        if (result === undefined) {
            res.status(404).send(`No user with ID ${id} was found`);
        } else if (result.email === undefined) {
            res.status(200).send({ 'firstName': result.first_name, 'lastName': result.last_name });
        } else {
            res.status(200).send({ 'email': result.email, 'firstName': result.first_name, 'lastName': result.last_name });
        }

        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const update = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PATCH updating information for user ${req.params.id}`);
    const validation = await validator.validate(
        validator.schemas.user_edit,
        req.body
    );

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

    if ((newPassword !== undefined && currentPassword === undefined)
        || (newPassword === undefined && currentPassword !== undefined)) {
        res.status(400).send("Bad Request. Both password fields are required to update password");
        return;
    }


    try {
        if (token === undefined || !((await isAuthenticated(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. This is not your account.");
            return;
        }

        if (newPassword !== undefined) {
            const currentHash = (await users.authenticateById(id))[0].password;

            if (!(await bcrypt.compare(currentPassword, currentHash)).valueOf()) { // Current password wrong
                res.status(401).send("Unauthorized or invalid current password");
                return;
            } else if (newPassword === currentPassword) { // Same password
                res.status(403).send("Password is the same as current password");
                return;
            } else { // Passwords are valid
                newPassword = (await bcrypt.hash(newPassword, bcrypt.saltRounds));
            }
        }

        const result = await users.alter(id, email, firstName, lastName, newPassword);

        if (result.affectedRows === 0) {
            res.status(404).send("User not found");
        } else {
            res.status(200).send("User updated successfully");
        }
        return;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Email already exists";
            res.status(403).send();
            return;
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const isAuthenticated = async (id: number, token: string): Promise<boolean> => {
    Logger.http(`Verifying active authentication for user ${id}`);
    try {
        const [result] = await users.checkAuthentication(id, token);
        return result.id === id;
    } catch (err) {
        return false;
    }
}

export { register, login, logout, view, update }