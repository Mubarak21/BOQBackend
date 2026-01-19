"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAmount = parseAmount;
exports.toNumber = toNumber;
exports.validateAndNormalizeAmount = validateAndNormalizeAmount;
exports.extractTransactionAmount = extractTransactionAmount;
exports.sumAmounts = sumAmounts;
function parseAmount(value) {
    if (typeof value === "number")
        return value;
    if (value === null || value === undefined)
        return 0;
    const str = String(value).trim();
    if (str === "" ||
        str === "-" ||
        str === " - " ||
        str === "—" ||
        str.toLowerCase() === "n/a") {
        return 0;
    }
    const cleaned = str.replace(/[^\d.-]/g, "").replace(/,/g, "");
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
function toNumber(value) {
    if (typeof value === "number")
        return value;
    if (value === null || value === undefined)
        return 0;
    const numValue = parseFloat(String(value));
    return isNaN(numValue) ? 0 : numValue;
}
function validateAndNormalizeAmount(value, maxValue = 9999999999999.99, precision = 2) {
    if (value === null || value === undefined)
        return 0;
    const numValue = toNumber(value);
    if (numValue === 0)
        return 0;
    const minValue = -maxValue;
    if (numValue > maxValue) {
        return maxValue;
    }
    if (numValue < minValue) {
        return minValue;
    }
    const multiplier = Math.pow(10, precision);
    return Math.round(numValue * multiplier) / multiplier;
}
function extractTransactionAmount(transaction) {
    return toNumber(transaction.amount);
}
function sumAmounts(items, getAmount = (item) => extractTransactionAmount(item)) {
    return items.reduce((sum, item) => {
        const amount = getAmount(item);
        return sum + amount;
    }, 0);
}
//# sourceMappingURL=amount.utils.js.map