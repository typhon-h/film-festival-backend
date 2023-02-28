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
        const result = await users.authenticationRequest(email, password);
        const userRequested = result[0];

        // If email matched AND password matches hash
        if (result.length === 0 || !(await bcrypt.compare(password, userRequested.password))) {
            res.status(401).send(`Not Authorized. Incorrect email/password`);
            return;
        }



        const token = nanoid(64); // Unique token
        const t = await users.assignToken(userRequested.id, token);

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
    try {
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try {
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const update = async (req: Request, res: Response): Promise<void> => {
    try {
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { register, login, logout, view, update }