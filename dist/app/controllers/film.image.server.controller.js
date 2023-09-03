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
exports.setImage = exports.getImage = void 0;
const filmImages = __importStar(require("../models/film.image.server.model"));
const user_server_controller_1 = require("../controllers/user.server.controller");
const film_server_model_1 = require("../models/film.server.model");
const film_server_controller_1 = require("../controllers/film.server.controller");
const nanoid_1 = require("nanoid");
const path = require("path");
const filesystem = require("fs");
const fs = filesystem.promises;
const allowedFiletypes = ['png', 'gif', 'jpeg'];
const filepath = path.resolve('storage/images') + '/';
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`GET Retrieve hero image for film: ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).send(`Invalid id: ${id}`);
        return;
    }
    try {
        const [img] = yield filmImages.getOne(id);
        if (img === undefined) {
            res.status(404).send(`No film with id ${id} or No image`);
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
            // Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`PUT Create/Update hero picture for film: ${req.params.id}`);
    const token = req.headers['x-authorization'];
    if (token === undefined || !(0, user_server_controller_1.isValidToken)(token.toString())) { // Undefined or token not exists
        res.status(401).send("Unauthorized.");
        return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).send(`No film with id ${id}`);
        return;
    }
    // Removing "image/"
    const filetype = (req.headers['content-type'] ? req.headers['content-type'].replace('image/', '') : "");
    if (!allowedFiletypes.includes(filetype)) {
        res.status(400).send('Bad Request. Invalid image supplied');
        return;
    }
    try {
        if (!((yield (0, user_server_controller_1.isAuthenticated)((yield (0, user_server_controller_1.retrieve)(token.toString())).id, token.toString())).valueOf())) { // Fix unecessary calls
            res.status(403).send("Forbidden. Cannot image if you are not the director");
            return;
        }
        if ((yield (0, film_server_model_1.getOne)(id)) === undefined) { // TODO: This will always be caught by 403
            res.status(404).send("Film not found.");
            return;
        }
        if ((yield (0, film_server_controller_1.hasReviews)(id)).valueOf()) {
            res.status(403).send("Forbidden. Film cannot be edited after it has been reviewed");
            return;
        }
        const newFilename = (0, nanoid_1.nanoid)() + '.' + filetype;
        // Add new profile picture
        yield fs.writeFile(filepath + newFilename, req.body);
        // Create
        if ((yield hasImage(id)).valueOf()) {
            const oldFilename = (yield filmImages.getOne(id))[0].image_filename;
            yield fs.unlink(filepath + oldFilename); // TODO: possibly do this after db update (store value of condition)
            res.statusMessage = "OK. Image Updated";
            res.status(200);
        }
        else {
            res.statusMessage = "Created";
            res.status(201);
        }
        // Update db with new image
        const result = yield filmImages.alter(id, newFilename);
        if (result.rowCount === 0) { // Should never happen since existence is checked for 403/404 error
            yield fs.unlink(filepath + newFilename); // Remove new file since not referenced in db
            throw new Error("Film no longer in database");
        }
        res.send();
        return;
    }
    catch (err) { // TODO: Delete created image if update fails
        // Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.setImage = setImage;
const hasImage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.http(`Checking if film ${id} has hero image`);
    try {
        const [img] = yield filmImages.getOne(id);
        return img.image_filename !== null;
    }
    catch (err) {
        // Logger.error(err);
        return false;
    }
});
//# sourceMappingURL=film.image.server.controller.js.map