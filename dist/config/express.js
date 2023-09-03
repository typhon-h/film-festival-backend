"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_middleware_1 = __importDefault(require("../app/middleware/cors.middleware"));
exports.default = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use(cors_middleware_1.default);
    // app.use(express.json());
    app.use(express_1.default.raw({ type: ['image/*'], limit: '5mb' }));
    app.use(express_1.default.raw({ type: 'text/plain' }));
    // Debug
    app.use((req, res, next) => {
        if (req.path !== '/') {
            // Logger.http(`##### ${req.method} ${req.path} #####`);
        }
        next();
    });
    app.get('/heartbeat', (req, res) => {
        res.send({ 'message': 'I\'m alive!' });
    });
    // ROUTES
    require('../app/routes/user.server.routes')(app);
    require('../app/routes/film.server.routes')(app);
    return app;
};
//# sourceMappingURL=express.js.map