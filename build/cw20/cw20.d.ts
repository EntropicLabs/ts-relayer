import { CosmWasmSigner } from "..";
export declare function init(owner: string, symbol: string, amount: string): Record<string, unknown>;
export declare function balance(cosmwasm: CosmWasmSigner, cw20Addr: string, senderAddress?: string): Promise<string>;
export declare function sendTokens(targetAddr: string, amount: string, msg: Record<string, unknown>): Record<string, unknown>;
