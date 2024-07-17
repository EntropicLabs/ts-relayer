import { DeliverTxResponse, Event } from "@cosmjs/stargate";
import { ReadonlyDateWithNanoseconds, ValidatorPubkey as RpcPubKey, tendermint34, tendermint37 } from "@cosmjs/tendermint-rpc";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { Packet } from "cosmjs-types/ibc/core/channel/v1/channel";
import { Height } from "cosmjs-types/ibc/core/client/v1/client";
import { ClientState as TendermintClientState, ConsensusState as TendermintConsensusState } from "cosmjs-types/ibc/lightclients/tendermint/v1/tendermint";
import { PublicKey as ProtoPubKey } from "cosmjs-types/tendermint/crypto/keys";
import { PacketWithMetadata } from "./endpoint";
export interface Ack {
    readonly acknowledgement: Uint8Array;
    readonly originalPacket: Packet;
}
export declare function createDeliverTxFailureMessage(result: DeliverTxResponse): string;
export declare function toIntHeight(height?: Height): number;
export declare function ensureIntHeight(height: bigint | Height): number;
export declare function subtractBlock(height: Height, count?: bigint): Height;
export declare function parseRevisionNumber(chainId: string): bigint;
export declare function may<T, U>(transform: (val: T) => U, value: T | null | undefined): U | undefined;
export declare function mapRpcPubKeyToProto(pubkey?: RpcPubKey): ProtoPubKey | undefined;
export declare function timestampFromDateNanos(date: ReadonlyDateWithNanoseconds): Timestamp;
export declare function secondsFromDateNanos(date: ReadonlyDateWithNanoseconds): number;
export declare function buildConsensusState(header: tendermint34.Header | tendermint37.Header): TendermintConsensusState;
export declare function buildClientState(chainId: string, unbondingPeriodSec: number, trustPeriodSec: number, height: Height): TendermintClientState;
export declare function parsePacketsFromBlockResult(result: tendermint34.BlockResultsResponse | tendermint37.BlockResultsResponse): Packet[];
/** Those events are normalized to strings already in CosmJS */
export declare function parsePacketsFromEvents(events: readonly Event[]): Packet[];
/**
 * Takes a list of events, finds the send_packet events, stringifies attributes
 * and parsed the events into `Packet`s.
 */
export declare function parsePacketsFromTendermintEvents(events: readonly (tendermint34.Event | tendermint37.Event)[]): Packet[];
export declare function parseHeightAttribute(attribute?: string): Height | undefined;
export declare function parsePacket({ type, attributes }: Event): Packet;
export declare function parseAcksFromTxEvents(events: readonly Event[]): Ack[];
export declare function parseAck({ type, attributes }: Event): Ack;
export declare function heightGreater(a: Height | undefined, b: Height): boolean;
export declare function timeGreater(a: bigint | undefined, b: number): boolean;
export declare function splitPendingPackets(currentHeight: Height, currentTime: number, // in seconds
packets: readonly PacketWithMetadata[]): {
    readonly toSubmit: readonly PacketWithMetadata[];
    readonly toTimeout: readonly PacketWithMetadata[];
};
export declare function presentPacketData(data: Uint8Array): Record<string, unknown>;
