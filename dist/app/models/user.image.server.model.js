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
exports.remove = exports.alter = exports.getOne = void 0;
const postgres_1 = require("@vercel/postgres");
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Retrieving filepath for profile picture of user ${id}`);
    const result = yield (0, postgres_1.sql) `select image_filename from user where id = ${id}`;
    return result.rows.map((row) => {
        const image = {
            image_filename: row.image_filename,
        };
        return image;
    });
});
exports.getOne = getOne;
const alter = (id, filename) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Updating profile image for user ${id}`);
    const result = yield (0, postgres_1.sql) `update user set image_filename = ${filename} where id = ${id}`;
    return result;
});
exports.alter = alter;
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Logger.info(`Removing profile image for user  ${id}`);
    const result = yield (0, postgres_1.sql) `update user set image_filename = null where id = ${id}`;
    return result;
});
exports.remove = remove;
//# sourceMappingURL=user.image.server.model.js.map