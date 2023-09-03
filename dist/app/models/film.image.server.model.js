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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alter = exports.getOne = void 0;
const postgres_1 = require("@vercel/postgres");
const logger_1 = __importDefault(require("../../config/logger"));
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Retrieving filepath for profile picture of user ${id}`);
    const result = yield (0, postgres_1.sql) `select image_filename from film where id = ${id}`;
    return result.rows.map((row) => {
        const image = {
            image_filename: row.image_filename,
        };
        return image;
    });
});
exports.getOne = getOne;
const alter = (id, filename) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating hero image for film ${id}`);
    const result = yield (0, postgres_1.sql) `update film set image_filename = ${filename} where id = ${id}`;
    return result;
});
exports.alter = alter;
//# sourceMappingURL=film.image.server.model.js.map