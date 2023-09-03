import express from "express"
import allowCrossOriginRequestsMiddleware from "../app/middleware/cors.middleware"
import Logger from "./logger"

export default () => {
    const app = express();

    // Middleware
    app.use(allowCrossOriginRequestsMiddleware);
    // app.use(express.json());
    app.use(express.raw({ type: ['image/*'], limit: '5mb' }));
    app.use(express.raw({ type: 'text/plain' }));


    // Debug
    app.use((req, res, next) => {
        if (req.path !== '/') {
            Logger.http(`##### ${req.method} ${req.path} #####`);
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
}