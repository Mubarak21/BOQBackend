"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelToSnake = camelToSnake;
const class_transformer_1 = require("class-transformer");
function camelToSnake(cls, obj) {
    const snakeObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            snakeObj[snakeKey] = obj[key];
        }
    }
    return (0, class_transformer_1.plainToInstance)(cls, snakeObj);
}
//# sourceMappingURL=camel-to-snake-transform.js.map