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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const userImages = __importStar(require("../models/user.image.server.model"));
const user_server_controller_1 = require("../controllers/user.server.controller");
const user_server_model_1 = require("../models/user.server.model");
const nanoid_1 = require("nanoid");
const path = require("path");
const filesystem = require("fs");
const fs = filesystem.promises;
const filepath = path.resolve('storage/images') + '/';
const allowedFiletypes = ['png', 'gif', 'jpeg'];
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET Retrieve profile image for user: ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).send(`No user with id ${id} found`);
        return;
    }
    try {
        const [img] = yield userImages.getOne(id);
        if (img === undefined) {
            res.status(404).send(`No user with id ${id} or Image not found`);
            return;
        }
        const file = path.resolve(filepath + img.image_filename);
        yield fs.access(file); // Try to access to confirm existence
        res.status(200).sendFile(file);
        return;
    }
    catch (err) {
        if (err.code === 'ENOENT') { // Missing file or directory
            res.status(404).send(`Image could not be found`);
        }
        else {
            logger_1.default.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`PUT Create/Update profile picture for user: ${req.params.id}`);
    const token = req.headers['x-authorization'];
    if (token === undefined || !(0, user_server_controller_1.isValidToken)(token.toString())) { // Undefined or token not exists
        res.status(401).send("Unauthorized.");
        return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).send(`No user with id ${id}`);
        return;
    }
    // Removing "image/"
    const filetype = (req.headers['content-type'] ? req.headers['content-type'].replace('image/', '') : "");
    if (!allowedFiletypes.includes(filetype)) {
        res.status(400).send('Bad Request. Invalid image supplied');
        return;
    }
    try {
        if (!((yield (0, user_server_controller_1.isAuthenticated)(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot change another user's profile picture");
            return;
        }
        if ((yield (0, user_server_model_1.getOneById)(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }
        const newFilename = (0, nanoid_1.nanoid)() + '.' + filetype;
        // Add new profile picture
        yield fs.writeFile(filepath + newFilename, req.body);
        // Create
        if ((yield hasImage(id)).valueOf()) {
            const oldFilename = (yield userImages.getOne(id))[0].image_filename;
            yield fs.unlink(filepath + oldFilename); // TODO: possibly do this after db update (store value of condition)
            res.statusMessage = "OK. Image Updated";
            res.status(200);
        }
        else {
            res.statusMessage = "Created";
            res.status(201);
        }
        // Update db with new image
        const result = yield userImages.alter(id, newFilename);
        if (result.rowCount === 0) { // Should never happen since existence is checked for 403/404 error
            yield fs.unlink(filepath + newFilename); // Remove new file since not referenced in db
            throw new Error("User no longer in database");
        }
        res.send();
        return;
    }
    catch (err) { // TODO: Delete created image if update fails
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.setImage = setImage;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`DELETE Remove profile picture for user: ${req.params.id}`);
    const token = req.headers['x-authorization'];
    if (token === undefined || !(0, user_server_controller_1.isValidToken)(token.toString())) { // Undefined or token not exists
        res.status(401).send("Unauthorized.");
        return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send(`No user with id ${id}`);
        return;
    }
    try {
        if (!((yield (0, user_server_controller_1.isAuthenticated)(id, token.toString())).valueOf())) {
            res.status(403).send("Forbidden. Cannot delete another user's profile picture");
            return;
        }
        if ((yield (0, user_server_model_1.getOneById)(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("User not found.");
            return;
        }
        const [img] = yield userImages.getOne(id);
        yield fs.unlink(filepath + img.image_filename);
        userImages.alter(id, null);
        res.status(200).send("Image deleted");
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteImage = deleteImage;
const hasImage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if user ${id} has profile image`);
    try {
        const [img] = yield userImages.getOne(id);
        return img.image_filename !== null;
    }
    catch (err) {
        logger_1.default.error(err);
        return false;
    }
});
//# sourceMappingURL=user.image.server.controller.js.map