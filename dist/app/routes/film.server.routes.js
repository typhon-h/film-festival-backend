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
Object.defineProperty(exports, "__esModule", { value: true });
const base_server_routes_1 = require("./base.server.routes");
const film = __importStar(require("../controllers/film.server.controller"));
const filmImages = __importStar(require("../controllers/film.image.server.controller"));
const filmReviews = __importStar(require("../controllers/film.review.server.controller"));
module.exports = (app) => {
    app.route(base_server_routes_1.rootUrl + '/films')
        .get(film.viewAll)
        .post(film.addOne);
    app.route(base_server_routes_1.rootUrl + '/films/genres')
        .get(film.getGenres);
    app.route(base_server_routes_1.rootUrl + '/films/:id')
        .get(film.getOne)
        .patch(film.editOne)
        .delete(film.deleteOne);
    app.route(base_server_routes_1.rootUrl + '/films/:id/reviews')
        .get(filmReviews.getReviews)
        .post(filmReviews.addReview);
    app.route(base_server_routes_1.rootUrl + '/films/:id/image')
        .get(filmImages.getImage)
        .put(filmImages.setImage);
};
//# sourceMappingURL=film.server.routes.js.map