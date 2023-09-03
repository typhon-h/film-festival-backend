"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("./config/express"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4941;
app.listen(port, () => {
    // // Logger.info('Listening on port: ' + port)
});
module.exports = app;
//# sourceMappingURL=server.js.map