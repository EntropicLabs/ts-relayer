import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";
import { Order } from "cosmjs-types/ibc/core/channel/v1/channel";
import { SinonSpy } from "sinon";
import { ChannelInfo, IbcClient } from "./ibcclient";
import { Logger, LogMethod } from "./logger";
export declare class TestLogger implements Logger {
    readonly error: SinonSpy & LogMethod;
    readonly warn: SinonSpy & LogMethod;
    readonly info: SinonSpy & LogMethod;
    readonly verbose: SinonSpy & LogMethod;
    readonly debug: SinonSpy & LogMethod;
    readonly child: () => TestLogger;
    constructor(shouldLog?: boolean);
}
export interface AccountInfo {
    mnemonic: string;
    pubkey0: {
        type: string;
        value: string;
    };
    address0: string;
}
export interface ChainDefinition {
    tendermintUrlWs: string;
    tendermintUrlHttp: string;
    chainId: string;
    prefix: string;
    denomStaking: string;
    denomFee: string;
    minFee: string;
    blockTime: number;
    ics20Port: string;
    faucet: AccountInfo;
    estimatedBlockTime: number;
    estimatedIndexerTime: number;
}
export declare const gaia: ChainDefinition;
export declare const wasmd: ChainDefinition;
export declare const osmosis: ChainDefinition;
export declare const ics20: {
    version: string;
    ordering: Order;
};
export interface SigningOpts {
    readonly tendermintUrlHttp: string;
    readonly prefix: string;
    readonly denomFee: string;
    readonly minFee: string;
    readonly estimatedBlockTime: number;
    readonly estimatedIndexerTime: number;
}
interface QueryOpts {
    readonly tendermintUrlHttp: string;
}
type FundingOpts = SigningOpts & {
    readonly faucet: {
        readonly mnemonic: string;
    };
};
export declare function queryClient(opts: QueryOpts): Promise<StargateClient>;
export declare function signingClient(opts: SigningOpts, mnemonic: string, logger?: Logger): Promise<IbcClient>;
export declare function signingCosmWasmClient(opts: SigningOpts, mnemonic: string): Promise<CosmWasmSigner>;
export declare function setupGaiaWasm(logger?: Logger): Promise<IbcClient[]>;
export declare function setup(srcConfig: ChainDefinition, destConfig: ChainDefinition, logger?: Logger): Promise<IbcClient[]>;
export interface CosmWasmSigner {
    readonly sign: SigningCosmWasmClient;
    readonly senderAddress: string;
}
export declare function setupWasmClient(): Promise<CosmWasmSigner>;
export declare function fundAccount(opts: FundingOpts, rcpt: string, amount: string): Promise<void>;
export declare function generateMnemonic(): string;
export declare function randomAddress(prefix: string): string;
export declare function transferTokens(src: IbcClient, srcDenom: string, dest: IbcClient, destPrefix: string, channel: ChannelInfo, amounts: number[], timeout?: number): Promise<number[]>;
export {};
