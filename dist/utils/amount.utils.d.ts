export declare function parseAmount(value: string | number | null | undefined): number;
export declare function toNumber(value: number | string | null | undefined): number;
export declare function validateAndNormalizeAmount(value: number | string | null | undefined, maxValue?: number, precision?: number): number;
export declare function extractTransactionAmount(transaction: {
    amount: number | string;
}): number;
export declare function sumAmounts<T extends {
    amount: number | string;
}>(items: T[], getAmount?: (item: T) => number): number;
