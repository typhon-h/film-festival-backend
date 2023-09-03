import express from './config/express'
import Logger from './config/logger'
import fetch from 'node-fetch'

const app = express();
const port = process.env.PORT || 4941;

app.listen(port, () => {
    Logger.info('Listening on port: ' + port)
});

module.exports = app;
