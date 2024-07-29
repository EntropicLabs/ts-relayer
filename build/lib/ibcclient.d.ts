import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { AuthExtension, BankExtension, Coin, DeliverTxResponse, Event, GasPrice, QueryClient, SigningStargateClient, SigningStargateClientOptions, StakingExtension, StdFee } from "@cosmjs/stargate";
import { comet38, CometClient, ReadonlyDateWithNanoseconds, tendermint34, tendermint37 } from "@cosmjs/tendermint-rpc";
import { Any } from "cosmjs-types/google/protobuf/any";
import { Order, Packet } from "cosmjs-types/ibc/core/channel/v1/channel";
import { Height } from "cosmjs-types/ibc/core/client/v1/client";
import { ClientState as TendermintClientState, ConsensusState as TendermintConsensusState, Header as TendermintHeader } from "cosmjs-types/ibc/lightclients/tendermint/v1/tendermint";
import { SignedHeader } from "cosmjs-types/tendermint/types/types";
import { ValidatorSet } from "cosmjs-types/tendermint/types/validator";
import { Logger } from "./logger";
import { IbcExtension } from "./queries/ibc";
import { Ack } from "./utils";
type CometHeader = tendermint34.Header | tendermint37.Header | comet38.Header;
type CometCommitResponse = tendermint34.CommitResponse | tendermint37.CommitResponse | comet38.CommitResponse;
export interface MsgResult {
    readonly events: readonly Event[];
    /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
    readonly transactionHash: string;
    /** block height where this transaction was committed - only set if we send 'block' mode */
    readonly height: number;
}
export type CreateClientResult = MsgResult & {
    readonly clientId: string;
};
export type CreateConnectionResult = MsgResult & {
    readonly connectionId: string;
};
export type CreateChannelResult = MsgResult & {
    readonly channelId: string;
};
interface ConnectionHandshakeProof {
    clientId: string;
    connectionId: string;
    clientState?: Any;
    proofHeight: Height;
    proofConnection: Uint8Array;
    proofClient: Uint8Array;
    proofConsensus: Uint8Array;
    consensusHeight?: Height;
}
export interface ChannelHandshake {
    id: ChannelInfo;
    proofHeight: Height;
    proof: Uint8Array;
    version?: string;
}
export interface ChannelInfo {
    readonly portId: string;
    readonly channelId: string;
}
export type IbcClientOptions = SigningStargateClientOptions & {
    logger?: Logger;
    gasPrice: GasPrice;
    estimatedBlockTime: number;
    estimatedIndexerTime: number;
    granter?: string;
};
export declare class IbcClient {
    readonly gasPrice: GasPrice;
    readonly sign: SigningStargateClient;
    readonly query: QueryClient & AuthExtension & BankExtension & IbcExtension & StakingExtension;
    readonly tm: CometClient;
    readonly senderAddress: string;
    readonly granterAddress?: string;
    readonly logger: Logger;
    readonly chainId: string;
    readonly revisionNumber: bigint;
    readonly estimatedBlockTime: number;
    readonly estimatedIndexerTime: number;
    static connectWithSigner(endpoint: string, signer: OfflineSigner, senderAddress: string, options: IbcClientOptions): Promise<IbcClient>;
    constructor(signingClient: SigningStargateClient, tmClient: CometClient, senderAddress: string, chainId: string, options: IbcClientOptions);
    calculateFee(messages: readonly EncodeObject[], memo?: string): Promise<StdFee>;
    signAndBroadcast(messages: readonly EncodeObject[], memo?: string): Promise<DeliverTxResponse>;
    revisionHeight(height: number): Height;
    ensureRevisionHeight(height: number | Height): Height;
    timeoutHeight(blocksInFuture: number): Promise<Height>;
    getChainId(): Promise<string>;
    header(height: number): Promise<CometHeader>;
    latestHeader(): Promise<CometHeader>;
    currentTime(): Promise<ReadonlyDateWithNanoseconds>;
    currentHeight(): Promise<number>;
    currentRevision(): Promise<Height>;
    waitOneBlock(): Promise<void>;
    waitForIndexer(): Promise<void>;
    getCommit(height?: number): Promise<CometCommitResponse>;
    /** Returns the unbonding period in seconds */
    getUnbondingPeriod(): Promise<number>;
    getSignedHeader(height?: number): Promise<SignedHeader>;
    getValidatorSet(height: number): Promise<ValidatorSet>;
    buildHeader(lastHeight: number): Promise<TendermintHeader>;
    getConnectionProof(clientId: string, connectionId: string, headerHeight: Height | number): Promise<ConnectionHandshakeProof>;
    getChannelProof(id: ChannelInfo, headerHeight: Height | number): Promise<ChannelHandshake>;
    getPacketProof(packet: Packet, headerHeight: Height | number): Promise<Uint8Array>;
    getAckProof({ originalPacket }: Ack, headerHeight: Height | number): Promise<Uint8Array>;
    getTimeoutProof({ originalPacket }: Ack, headerHeight: Height | number): Promise<Uint8Array>;
    doUpdateClient(clientId: string, src: IbcClient): Promise<Height>;
    /***** These are all direct wrappers around message constructors ********/
    sendTokens(recipientAddress: string, transferAmount: Coin[], memo?: string): Promise<MsgResult>;
    sendMultiMsg(msgs: EncodeObject[]): Promise<MsgResult>;
    createTendermintClient(clientState: TendermintClientState, consensusState: TendermintConsensusState): Promise<CreateClientResult>;
    updateTendermintClient(clientId: string, header: TendermintHeader): Promise<MsgResult>;
    connOpenInit(clientId: string, remoteClientId: string): Promise<CreateConnectionResult>;
    connOpenTry(myClientId: string, proof: ConnectionHandshakeProof): Promise<CreateConnectionResult>;
    connOpenAck(myConnectionId: string, proof: ConnectionHandshakeProof): Promise<MsgResult>;
    connOpenConfirm(myConnectionId: string, proof: ConnectionHandshakeProof): Promise<MsgResult>;
    channelOpenInit(portId: string, remotePortId: string, ordering: Order, connectionId: string, version: string): Promise<CreateChannelResult>;
    channelOpenTry(portId: string, remote: ChannelInfo, ordering: Order, connectionId: string, version: string, counterpartyVersion: string, proof: ChannelHandshake): Promise<CreateChannelResult>;
    channelOpenAck(portId: string, channelId: string, counterpartyChannelId: string, counterpartyVersion: string, proof: ChannelHandshake): Promise<MsgResult>;
    channelOpenConfirm(portId: string, channelId: string, proof: ChannelHandshake): Promise<MsgResult>;
    receivePacket(packet: Packet, proofCommitment: Uint8Array, proofHeight?: Height): Promise<MsgResult>;
    receivePackets(packets: readonly Packet[], proofCommitments: readonly Uint8Array[], proofHeight?: Height): Promise<MsgResult>;
    acknowledgePacket(ack: Ack, proofAcked: Uint8Array, proofHeight?: Height): Promise<MsgResult>;
    acknowledgePackets(acks: readonly Ack[], proofAckeds: readonly Uint8Array[], proofHeight?: Height): Promise<MsgResult>;
    timeoutPacket(packet: Packet, proofUnreceived: Uint8Array, nextSequenceRecv: bigint, proofHeight: Height): Promise<MsgResult>;
    timeoutPackets(packets: Packet[], proofsUnreceived: Uint8Array[], nextSequenceRecv: bigint[], proofHeight: Height): Promise<MsgResult>;
    transferTokens(sourcePort: string, sourceChannel: string, token: Coin, receiver: string, timeoutHeight?: Height, 
    /** timeout in seconds (SigningStargateClient converts to nanoseconds) */
    timeoutTime?: number): Promise<MsgResult>;
}
export interface CreateClientArgs {
    clientState: TendermintClientState;
    consensusState: TendermintConsensusState;
}
export declare function buildCreateClientArgs(src: IbcClient, trustPeriodSec?: number | null): Promise<CreateClientArgs>;
export declare function prepareConnectionHandshake(src: IbcClient, dest: IbcClient, clientIdSrc: string, clientIdDest: string, connIdSrc: string): Promise<ConnectionHandshakeProof>;
export declare function prepareChannelHandshake(src: IbcClient, dest: IbcClient, clientIdDest: string, portId: string, channelId: string): Promise<{
    proof: ChannelHandshake;
    version?: string;
}>;
export {};
