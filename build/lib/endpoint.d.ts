import { Event } from "@cosmjs/stargate";
import { tendermint34, tendermint37 } from "@cosmjs/tendermint-rpc";
import { Packet } from "cosmjs-types/ibc/core/channel/v1/channel";
import { IbcClient } from "./ibcclient";
import { Ack } from "./utils";
export interface PacketWithMetadata {
    packet: Packet;
    height: number;
}
export type AckWithMetadata = Ack & {
    height: number;
    /**
     * The hash of the transaction in which the ack was found.
     * Encoded as upper case hex.
     */
    txHash: string;
    /**
     * The events of the transaction in which the ack was found.
     * Please note that the events do not necessarily belong to the ack.
     */
    txEvents: readonly Event[];
};
export interface QueryOpts {
    minHeight?: number;
    maxHeight?: number;
}
/**
 * Endpoint is a wrapper around SigningStargateClient as well as ClientID
 * and ConnectionID. Two Endpoints compose a Link and this should expose all the
 * methods you need to work on one half of an IBC Connection, the higher-level
 * orchestration is handled in Link.
 */
export declare class Endpoint {
    readonly client: IbcClient;
    readonly clientID: string;
    readonly connectionID: string;
    constructor(client: IbcClient, clientID: string, connectionID: string);
    chainId(): string;
    getLatestCommit(): Promise<tendermint34.CommitResponse | tendermint37.CommitResponse>;
    private getPacketsFromBlockEvents;
    private getPacketsFromTxs;
    querySentPackets({ minHeight, maxHeight, }?: QueryOpts): Promise<PacketWithMetadata[]>;
    queryWrittenAcks({ minHeight, maxHeight, }?: QueryOpts): Promise<AckWithMetadata[]>;
}
/**
 * Requires a match of any set field
 *
 * This is designed to easily produce search/subscription query strings,
 * not principally for in-memory filtering.
 */
export interface Filter {
    readonly srcPortId?: string;
    readonly srcChannelId?: string;
    readonly destPortId?: string;
    readonly destChannelId?: string;
}
