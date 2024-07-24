"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareChannelHandshake = exports.prepareConnectionHandshake = exports.buildCreateClientArgs = exports.IbcClient = void 0;
const encoding_1 = require("@cosmjs/encoding");
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const utils_1 = require("@cosmjs/utils");
const tx_1 = require("cosmjs-types/ibc/applications/transfer/v1/tx");
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const tx_2 = require("cosmjs-types/ibc/core/channel/v1/tx");
const client_1 = require("cosmjs-types/ibc/core/client/v1/client");
const tx_3 = require("cosmjs-types/ibc/core/client/v1/tx");
const tx_4 = require("cosmjs-types/ibc/core/connection/v1/tx");
const tendermint_1 = require("cosmjs-types/ibc/lightclients/tendermint/v1/tendermint");
const types_1 = require("cosmjs-types/tendermint/types/types");
const validator_1 = require("cosmjs-types/tendermint/types/validator");
const logger_1 = require("./logger");
const ibc_1 = require("./queries/ibc");
const utils_2 = require("./utils");
function deepCloneAndMutate(object, mutateFn) {
    const deepClonedObject = structuredClone(object);
    mutateFn(deepClonedObject);
    return deepClonedObject;
}
function toBase64AsAny(...input) {
    return (0, encoding_1.toBase64)(...input); // eslint-disable-line @typescript-eslint/no-explicit-any
}
/**** These are needed to bootstrap the endpoints */
/* Some of them are hardcoded various places, which should we make configurable? */
// const DefaultTrustLevel = '1/3';
// const MaxClockDrift = 10; // 10 seconds
// const upgradePath = ['upgrade', 'upgradedIBCState'];
// const allowUpgradeAfterExpiry = false;
// const allowUpgradeAfterMisbehavior = false;
// these are from the cosmos sdk implementation
const defaultMerklePrefix = {
    keyPrefix: (0, encoding_1.toAscii)("ibc"),
};
const defaultConnectionVersion = {
    identifier: "1",
    features: ["ORDER_ORDERED", "ORDER_UNORDERED"],
};
// this is a sane default, but we can revisit it
const defaultDelayPeriod = 0n;
function ibcRegistry() {
    return new proto_signing_1.Registry([
        ...stargate_1.defaultRegistryTypes,
        ["/ibc.core.client.v1.MsgCreateClient", tx_3.MsgCreateClient],
        ["/ibc.core.client.v1.MsgUpdateClient", tx_3.MsgUpdateClient],
        ["/ibc.core.connection.v1.MsgConnectionOpenInit", tx_4.MsgConnectionOpenInit],
        ["/ibc.core.connection.v1.MsgConnectionOpenTry", tx_4.MsgConnectionOpenTry],
        ["/ibc.core.connection.v1.MsgConnectionOpenAck", tx_4.MsgConnectionOpenAck],
        [
            "/ibc.core.connection.v1.MsgConnectionOpenConfirm",
            tx_4.MsgConnectionOpenConfirm,
        ],
        ["/ibc.core.channel.v1.MsgChannelOpenInit", tx_2.MsgChannelOpenInit],
        ["/ibc.core.channel.v1.MsgChannelOpenTry", tx_2.MsgChannelOpenTry],
        ["/ibc.core.channel.v1.MsgChannelOpenAck", tx_2.MsgChannelOpenAck],
        ["/ibc.core.channel.v1.MsgChannelOpenConfirm", tx_2.MsgChannelOpenConfirm],
        ["/ibc.core.channel.v1.MsgRecvPacket", tx_2.MsgRecvPacket],
        ["/ibc.core.channel.v1.MsgAcknowledgement", tx_2.MsgAcknowledgement],
        ["/ibc.core.channel.v1.MsgTimeout", tx_2.MsgTimeout],
        ["/ibc.applications.transfer.v1.MsgTransfer", tx_1.MsgTransfer],
    ]);
}
class IbcClient {
    static async connectWithSigner(endpoint, signer, senderAddress, options) {
        // override any registry setup, use the other options
        const mergedOptions = {
            ...options,
            registry: ibcRegistry(),
        };
        const signingClient = await stargate_1.SigningStargateClient.connectWithSigner(endpoint, signer, mergedOptions);
        const tmClient = await (0, tendermint_rpc_1.connectComet)(endpoint);
        const chainId = await signingClient.getChainId();
        return new IbcClient(signingClient, tmClient, senderAddress, chainId, options);
    }
    constructor(signingClient, tmClient, senderAddress, chainId, options) {
        this.sign = signingClient;
        this.tm = tmClient;
        this.query = stargate_1.QueryClient.withExtensions(tmClient, stargate_1.setupAuthExtension, stargate_1.setupBankExtension, ibc_1.setupIbcExtension, stargate_1.setupStakingExtension);
        this.senderAddress = senderAddress;
        this.chainId = chainId;
        this.revisionNumber = (0, utils_2.parseRevisionNumber)(chainId);
        this.gasPrice = options.gasPrice;
        this.logger = options.logger ?? new logger_1.NoopLogger();
        this.estimatedBlockTime = options.estimatedBlockTime;
        this.estimatedIndexerTime = options.estimatedIndexerTime;
    }
    revisionHeight(height) {
        return client_1.Height.fromPartial({
            revisionHeight: BigInt(height),
            revisionNumber: this.revisionNumber,
        });
    }
    ensureRevisionHeight(height) {
        if (typeof height === "number") {
            return client_1.Height.fromPartial({
                revisionHeight: BigInt(height),
                revisionNumber: this.revisionNumber,
            });
        }
        if (height.revisionNumber !== this.revisionNumber) {
            throw new Error(`Using incorrect revisionNumber ${height.revisionNumber} on chain with ${this.revisionNumber}`);
        }
        return height;
    }
    async timeoutHeight(blocksInFuture) {
        const header = await this.latestHeader();
        return this.revisionHeight(header.height + blocksInFuture);
    }
    getChainId() {
        this.logger.verbose("Get chain ID");
        return this.sign.getChainId();
    }
    async header(height) {
        this.logger.verbose(`Get header for height ${height}`);
        // TODO: expose header method on tmClient and use that
        const resp = await this.tm.blockchain(height, height);
        return resp.blockMetas[0].header;
    }
    async latestHeader() {
        // TODO: expose header method on tmClient and use that
        const block = await this.tm.block();
        return block.block.header;
    }
    async currentTime() {
        // const status = await this.tm.status();
        // return status.syncInfo.latestBlockTime;
        return (await this.latestHeader()).time;
    }
    async currentHeight() {
        const status = await this.tm.status();
        return status.syncInfo.latestBlockHeight;
    }
    async currentRevision() {
        const block = await this.currentHeight();
        return this.revisionHeight(block);
    }
    async waitOneBlock() {
        // ensure this works
        const start = await this.currentHeight();
        let end;
        do {
            await (0, utils_1.sleep)(this.estimatedBlockTime);
            end = await this.currentHeight();
        } while (end === start);
        // TODO: this works but only for websocket connections, is there some code that falls back to polling in cosmjs?
        // await firstEvent(this.tm.subscribeNewBlockHeader());
    }
    // we may have to wait a bit before a tx returns and making queries on the event log
    async waitForIndexer() {
        await (0, utils_1.sleep)(this.estimatedIndexerTime);
    }
    getCommit(height) {
        this.logger.verbose(height === undefined
            ? "Get latest commit"
            : `Get commit for height ${height}`);
        return this.tm.commit(height);
    }
    /** Returns the unbonding period in seconds */
    async getUnbondingPeriod() {
        const { params } = await this.query.staking.params();
        const seconds = Number(params?.unbondingTime?.seconds ?? 0);
        if (!seconds) {
            throw new Error("No unbonding period found");
        }
        this.logger.verbose("Queried unbonding period", { seconds });
        return seconds;
    }
    async getSignedHeader(height) {
        const { header: rpcHeader, commit: rpcCommit } = await this.getCommit(height);
        const header = types_1.Header.fromPartial({
            ...rpcHeader,
            version: {
                block: BigInt(rpcHeader.version.block),
                app: BigInt(rpcHeader.version.app),
            },
            height: BigInt(rpcHeader.height),
            time: (0, utils_2.timestampFromDateNanos)(rpcHeader.time),
            lastBlockId: {
                hash: rpcHeader.lastBlockId?.hash,
                partSetHeader: rpcHeader.lastBlockId?.parts,
            },
        });
        const signatures = rpcCommit.signatures.map((sig) => ({
            ...sig,
            timestamp: sig.timestamp && (0, utils_2.timestampFromDateNanos)(sig.timestamp),
            blockIdFlag: (0, types_1.blockIDFlagFromJSON)(sig.blockIdFlag),
        }));
        const commit = types_1.Commit.fromPartial({
            height: BigInt(rpcCommit.height),
            round: rpcCommit.round,
            blockId: {
                hash: rpcCommit.blockId.hash,
                partSetHeader: rpcCommit.blockId.parts,
            },
            signatures,
        });
        // For the vote sign bytes, it checks (from the commit):
        //   Height, Round, BlockId, TimeStamp, ChainID
        return { header, commit };
    }
    async getValidatorSet(height) {
        this.logger.verbose(`Get validator set for height ${height}`);
        // we need to query the header to find out who the proposer was, and pull them out
        const { proposerAddress } = await this.header(height);
        const validators = await this.tm.validatorsAll(height);
        const mappedValidators = validators.validators.map((val) => ({
            address: val.address,
            pubKey: (0, utils_2.mapRpcPubKeyToProto)(val.pubkey),
            votingPower: val.votingPower,
            proposerPriority: val.proposerPriority
                ? BigInt(val.proposerPriority)
                : undefined,
        }));
        const totalPower = validators.validators.reduce((accumulator, v) => accumulator + v.votingPower, BigInt(0));
        const proposer = mappedValidators.find((val) => (0, utils_1.arrayContentEquals)(val.address, proposerAddress));
        return validator_1.ValidatorSet.fromPartial({
            validators: mappedValidators,
            totalVotingPower: totalPower,
            proposer,
        });
    }
    // this builds a header to update a remote client.
    // you must pass the last known height on the remote side so we can properly generate it.
    // it will update to the latest state of this chain.
    //
    // This is the logic that validates the returned struct:
    // ibc check: https://github.com/cosmos/cosmos-sdk/blob/v0.41.0/x/ibc/light-clients/07-tendermint/types/update.go#L87-L167
    // tendermint check: https://github.com/tendermint/tendermint/blob/v0.34.3/light/verifier.go#L19-L79
    // sign bytes: https://github.com/tendermint/tendermint/blob/v0.34.3/types/validator_set.go#L762-L821
    //   * https://github.com/tendermint/tendermint/blob/v0.34.3/types/validator_set.go#L807-L810
    //   * https://github.com/tendermint/tendermint/blob/v0.34.3/types/block.go#L780-L809
    //   * https://github.com/tendermint/tendermint/blob/bf9e36d02d2eb22f6fe8961d0d7d3d34307ba38e/types/canonical.go#L54-L65
    //
    // For the vote sign bytes, it checks (from the commit):
    //   Height, Round, BlockId, TimeStamp, ChainID
    async buildHeader(lastHeight) {
        const signedHeader = await this.getSignedHeader();
        // "assert that trustedVals is NextValidators of last trusted header"
        // https://github.com/cosmos/cosmos-sdk/blob/v0.41.0/x/ibc/light-clients/07-tendermint/types/update.go#L74
        const validatorHeight = lastHeight + 1;
        /* eslint @typescript-eslint/no-non-null-assertion: "off" */
        const curHeight = Number(signedHeader.header.height);
        return tendermint_1.Header.fromPartial({
            signedHeader,
            validatorSet: await this.getValidatorSet(curHeight),
            trustedHeight: this.revisionHeight(lastHeight),
            trustedValidators: await this.getValidatorSet(validatorHeight),
        });
    }
    // trustedHeight must be proven by the client on the destination chain
    // and include a proof for the connOpenInit (eg. must be 1 or more blocks after the
    // block connOpenInit Tx was in).
    //
    // pass a header height that was previously updated to on the remote chain using updateClient.
    // note: the queries will be for the block before this header, so the proofs match up (appHash is on H+1)
    async getConnectionProof(clientId, connectionId, headerHeight) {
        const proofHeight = this.ensureRevisionHeight(headerHeight);
        const queryHeight = (0, utils_2.subtractBlock)(proofHeight, 1n);
        const { clientState, proof: proofClient,
        // proofHeight,
         } = await this.query.ibc.proof.client.state(clientId, queryHeight);
        // This is the most recent state we have on this chain of the other
        const { latestHeight: consensusHeight } = await this.query.ibc.client.stateTm(clientId);
        (0, utils_1.assert)(consensusHeight);
        // get the init proof
        const { proof: proofConnection } = await this.query.ibc.proof.connection.connection(connectionId, queryHeight);
        // get the consensus proof
        const { proof: proofConsensus } = await this.query.ibc.proof.client.consensusState(clientId, consensusHeight, queryHeight);
        return {
            clientId,
            clientState,
            connectionId,
            proofHeight,
            proofConnection,
            proofClient,
            proofConsensus,
            consensusHeight,
        };
    }
    // trustedHeight must be proven by the client on the destination chain
    // and include a proof for the connOpenInit (eg. must be 1 or more blocks after the
    // block connOpenInit Tx was in).
    //
    // pass a header height that was previously updated to on the remote chain using updateClient.
    // note: the queries will be for the block before this header, so the proofs match up (appHash is on H+1)
    async getChannelProof(id, headerHeight) {
        const proofHeight = this.ensureRevisionHeight(headerHeight);
        const queryHeight = (0, utils_2.subtractBlock)(proofHeight, 1n);
        const channel = await this.query.ibc.proof.channel.channel(id.portId, id.channelId, queryHeight);
        const { proof } = channel;
        this.logger.verbose(`Get channel proof for ${id.portId}/${id.channelId}`, {
            channel,
        });
        return {
            id,
            proofHeight,
            proof,
            version: channel.channel?.version,
        };
    }
    async getPacketProof(packet, headerHeight) {
        const proofHeight = this.ensureRevisionHeight(headerHeight);
        const queryHeight = (0, utils_2.subtractBlock)(proofHeight, 1n);
        const { proof } = await this.query.ibc.proof.channel.packetCommitment(packet.sourcePort, packet.sourceChannel, packet.sequence, queryHeight);
        return proof;
    }
    async getAckProof({ originalPacket }, headerHeight) {
        const proofHeight = this.ensureRevisionHeight(headerHeight);
        const queryHeight = (0, utils_2.subtractBlock)(proofHeight, 1n);
        const res = await this.query.ibc.proof.channel.packetAcknowledgement(originalPacket.destinationPort, originalPacket.destinationChannel, Number(originalPacket.sequence), queryHeight);
        const { proof } = res;
        return proof;
    }
    async getTimeoutProof({ originalPacket }, headerHeight) {
        const proofHeight = this.ensureRevisionHeight(headerHeight);
        const queryHeight = (0, utils_2.subtractBlock)(proofHeight, 1n);
        const proof = await this.query.ibc.proof.channel.receiptProof(originalPacket.destinationPort, originalPacket.destinationChannel, Number(originalPacket.sequence), queryHeight);
        return proof;
    }
    /*
    These are helpers to query, build data and submit a message
    Currently all prefixed with doXxx, but please look for better naming
    */
    // Updates existing client on this chain with data from src chain.
    // Returns the height that was updated to.
    async doUpdateClient(clientId, src) {
        const { latestHeight } = await this.query.ibc.client.stateTm(clientId);
        const header = await src.buildHeader((0, utils_2.toIntHeight)(latestHeight));
        await this.updateTendermintClient(clientId, header);
        const height = Number(header.signedHeader?.header?.height ?? 0);
        return src.revisionHeight(height);
    }
    /***** These are all direct wrappers around message constructors ********/
    async sendTokens(recipientAddress, transferAmount, memo) {
        this.logger.verbose(`Send tokens to ${recipientAddress}`);
        this.logger.debug("Send tokens:", {
            senderAddress: this.senderAddress,
            recipientAddress,
            transferAmount,
            memo,
        });
        const result = await this.sign.sendTokens(this.senderAddress, recipientAddress, transferAmount, "auto", memo);
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    /* Send any number of messages, you are responsible for encoding them */
    async sendMultiMsg(msgs) {
        this.logger.verbose(`Broadcast multiple msgs`);
        this.logger.debug(`Multiple msgs:`, {
            msgs,
        });
        const senderAddress = this.senderAddress;
        const result = await this.sign.signAndBroadcast(senderAddress, msgs, "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async createTendermintClient(clientState, consensusState) {
        this.logger.verbose(`Create Tendermint client`);
        const senderAddress = this.senderAddress;
        const createMsg = {
            typeUrl: "/ibc.core.client.v1.MsgCreateClient",
            value: tx_3.MsgCreateClient.fromPartial({
                signer: senderAddress,
                clientState: {
                    typeUrl: "/ibc.lightclients.tendermint.v1.ClientState",
                    value: tendermint_1.ClientState.encode(clientState).finish(),
                },
                consensusState: {
                    typeUrl: "/ibc.lightclients.tendermint.v1.ConsensusState",
                    value: tendermint_1.ConsensusState.encode(consensusState).finish(),
                },
            }),
        };
        this.logger.debug("MsgCreateClient", createMsg);
        const result = await this.sign.signAndBroadcast(senderAddress, [createMsg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        const clientId = result.events
            .find((x) => x.type == "create_client")
            ?.attributes.find((x) => x.key == "client_id")?.value;
        if (!clientId) {
            throw new Error("Could not read TX events.");
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
            clientId,
        };
    }
    async updateTendermintClient(clientId, header) {
        this.logger.verbose(`Update Tendermint client ${clientId}`);
        const senderAddress = this.senderAddress;
        const updateMsg = {
            typeUrl: "/ibc.core.client.v1.MsgUpdateClient",
            value: tx_3.MsgUpdateClient.fromPartial({
                signer: senderAddress,
                clientId,
                clientMessage: {
                    typeUrl: "/ibc.lightclients.tendermint.v1.Header",
                    value: tendermint_1.Header.encode(header).finish(),
                },
            }),
        };
        this.logger.debug(`MsgUpdateClient`, deepCloneAndMutate(updateMsg, (mutableMsg) => {
            if (mutableMsg.value.clientMessage?.value) {
                mutableMsg.value.clientMessage.value = toBase64AsAny(mutableMsg.value.clientMessage.value);
            }
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [updateMsg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async connOpenInit(clientId, remoteClientId) {
        this.logger.info(`Connection open init: ${clientId} => ${remoteClientId}`);
        const senderAddress = this.senderAddress;
        const msg = {
            typeUrl: "/ibc.core.connection.v1.MsgConnectionOpenInit",
            value: tx_4.MsgConnectionOpenInit.fromPartial({
                clientId,
                counterparty: {
                    clientId: remoteClientId,
                    prefix: defaultMerklePrefix,
                },
                version: defaultConnectionVersion,
                delayPeriod: defaultDelayPeriod,
                signer: senderAddress,
            }),
        };
        this.logger.debug(`MsgConnectionOpenInit`, msg);
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        const connectionId = result.events
            .find((x) => x.type == "connection_open_init")
            ?.attributes.find((x) => x.key == "connection_id")?.value;
        if (!connectionId) {
            throw new Error("Could not read TX events.");
        }
        this.logger.debug(`Connection open init successful: ${connectionId}`);
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
            connectionId,
        };
    }
    async connOpenTry(myClientId, proof) {
        this.logger.info(`Connection open try: ${myClientId} => ${proof.clientId} (${proof.connectionId})`);
        const senderAddress = this.senderAddress;
        const { clientId, connectionId, clientState, proofHeight, proofConnection: proofInit, proofClient, proofConsensus, consensusHeight, } = proof;
        const msg = {
            typeUrl: "/ibc.core.connection.v1.MsgConnectionOpenTry",
            value: tx_4.MsgConnectionOpenTry.fromPartial({
                clientId: myClientId,
                counterparty: {
                    clientId,
                    connectionId,
                    prefix: defaultMerklePrefix,
                },
                delayPeriod: defaultDelayPeriod,
                counterpartyVersions: [defaultConnectionVersion],
                signer: senderAddress,
                clientState,
                proofHeight,
                proofInit,
                proofClient,
                proofConsensus,
                consensusHeight,
            }),
        };
        this.logger.debug("MsgConnectionOpenTry", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofClient = toBase64AsAny(mutableMsg.value.proofClient);
            mutableMsg.value.proofConsensus = toBase64AsAny(mutableMsg.value.proofConsensus);
            mutableMsg.value.proofInit = toBase64AsAny(mutableMsg.value.proofInit);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        const myConnectionId = result.events
            .find((x) => x.type == "connection_open_try")
            ?.attributes.find((x) => x.key == "connection_id")?.value;
        if (!myConnectionId) {
            throw new Error("Could not read TX events.");
        }
        this.logger.debug(`Connection open try successful: ${myConnectionId} => ${connectionId}`);
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
            connectionId: myConnectionId,
        };
    }
    async connOpenAck(myConnectionId, proof) {
        this.logger.info(`Connection open ack: ${myConnectionId} => ${proof.connectionId}`);
        const senderAddress = this.senderAddress;
        const { connectionId, clientState, proofHeight, proofConnection: proofTry, proofClient, proofConsensus, consensusHeight, } = proof;
        const msg = {
            typeUrl: "/ibc.core.connection.v1.MsgConnectionOpenAck",
            value: tx_4.MsgConnectionOpenAck.fromPartial({
                connectionId: myConnectionId,
                counterpartyConnectionId: connectionId,
                version: defaultConnectionVersion,
                signer: senderAddress,
                clientState,
                proofHeight,
                proofTry,
                proofClient,
                proofConsensus,
                consensusHeight,
            }),
        };
        this.logger.debug("MsgConnectionOpenAck", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofConsensus = toBase64AsAny(mutableMsg.value.proofConsensus);
            mutableMsg.value.proofTry = toBase64AsAny(mutableMsg.value.proofTry);
            mutableMsg.value.proofClient = toBase64AsAny(mutableMsg.value.proofClient);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async connOpenConfirm(myConnectionId, proof) {
        this.logger.info(`Connection open confirm: ${myConnectionId}`);
        const senderAddress = this.senderAddress;
        const { proofHeight, proofConnection: proofAck } = proof;
        const msg = {
            typeUrl: "/ibc.core.connection.v1.MsgConnectionOpenConfirm",
            value: tx_4.MsgConnectionOpenConfirm.fromPartial({
                connectionId: myConnectionId,
                signer: senderAddress,
                proofHeight,
                proofAck,
            }),
        };
        this.logger.debug("MsgConnectionOpenConfirm", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofAck = toBase64AsAny(mutableMsg.value.proofAck);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async channelOpenInit(portId, remotePortId, ordering, connectionId, version) {
        this.logger.verbose(`Channel open init: ${portId} => ${remotePortId} (${connectionId})`);
        const senderAddress = this.senderAddress;
        const msg = {
            typeUrl: "/ibc.core.channel.v1.MsgChannelOpenInit",
            value: tx_2.MsgChannelOpenInit.fromPartial({
                portId,
                channel: {
                    state: channel_1.State.STATE_INIT,
                    ordering,
                    counterparty: {
                        portId: remotePortId,
                    },
                    connectionHops: [connectionId],
                    version,
                },
                signer: senderAddress,
            }),
        };
        this.logger.debug("MsgChannelOpenInit", msg);
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        const channelId = result.events
            .find((x) => x.type == "channel_open_init")
            ?.attributes.find((x) => x.key == "channel_id")?.value;
        if (!channelId) {
            throw new Error("Could not read TX events.");
        }
        this.logger.debug(`Channel open init successful: ${channelId}`);
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
            channelId,
        };
    }
    async channelOpenTry(portId, remote, ordering, connectionId, version, counterpartyVersion, proof) {
        this.logger.verbose(`Channel open try: ${portId} => ${remote.portId} (${remote.channelId})`);
        const senderAddress = this.senderAddress;
        const { proofHeight, proof: proofInit } = proof;
        const msg = {
            typeUrl: "/ibc.core.channel.v1.MsgChannelOpenTry",
            value: tx_2.MsgChannelOpenTry.fromPartial({
                portId,
                counterpartyVersion,
                channel: {
                    state: channel_1.State.STATE_TRYOPEN,
                    ordering,
                    counterparty: remote,
                    connectionHops: [connectionId],
                    version,
                },
                proofInit,
                proofHeight,
                signer: senderAddress,
            }),
        };
        this.logger.debug("MsgChannelOpenTry", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofInit = toBase64AsAny(mutableMsg.value.proofInit);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        const channelId = result.events
            .find((x) => x.type == "channel_open_try")
            ?.attributes.find((x) => x.key == "channel_id")?.value;
        if (!channelId) {
            throw new Error("Could not read TX events.");
        }
        this.logger.debug(`Channel open try successful: ${channelId} => ${remote.channelId})`);
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
            channelId,
        };
    }
    async channelOpenAck(portId, channelId, counterpartyChannelId, counterpartyVersion, proof) {
        this.logger.verbose(`Channel open ack for port ${portId}: ${channelId} => ${counterpartyChannelId}`);
        const senderAddress = this.senderAddress;
        const { proofHeight, proof: proofTry } = proof;
        const msg = {
            typeUrl: "/ibc.core.channel.v1.MsgChannelOpenAck",
            value: tx_2.MsgChannelOpenAck.fromPartial({
                portId,
                channelId,
                counterpartyChannelId,
                counterpartyVersion,
                proofTry,
                proofHeight,
                signer: senderAddress,
            }),
        };
        this.logger.debug("MsgChannelOpenAck", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofTry = toBase64AsAny(mutableMsg.value.proofTry);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async channelOpenConfirm(portId, channelId, proof) {
        this.logger.verbose(`Chanel open confirm for port ${portId}: ${channelId} => ${proof.id.channelId}`);
        const senderAddress = this.senderAddress;
        const { proofHeight, proof: proofAck } = proof;
        const msg = {
            typeUrl: "/ibc.core.channel.v1.MsgChannelOpenConfirm",
            value: tx_2.MsgChannelOpenConfirm.fromPartial({
                portId,
                channelId,
                proofAck,
                proofHeight,
                signer: senderAddress,
            }),
        };
        this.logger.debug("MsgChannelOpenConfirm", deepCloneAndMutate(msg, (mutableMsg) => {
            mutableMsg.value.proofAck = toBase64AsAny(mutableMsg.value.proofAck);
        }));
        const result = await this.sign.signAndBroadcast(senderAddress, [msg], "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    receivePacket(packet, proofCommitment, proofHeight) {
        return this.receivePackets([packet], [proofCommitment], proofHeight);
    }
    async receivePackets(packets, proofCommitments, proofHeight) {
        this.logger.verbose(`Receive ${packets.length} packets..`);
        if (packets.length !== proofCommitments.length) {
            throw new Error(`Have ${packets.length} packets, but ${proofCommitments.length} proofs`);
        }
        if (packets.length === 0) {
            throw new Error("Must submit at least 1 packet");
        }
        const senderAddress = this.senderAddress;
        const msgs = [];
        for (const i in packets) {
            const packet = packets[i];
            this.logger.verbose(`Sending packet #${packet.sequence} from ${this.chainId}:${packet.sourceChannel}`, (0, utils_2.presentPacketData)(packet.data));
            const msg = {
                typeUrl: "/ibc.core.channel.v1.MsgRecvPacket",
                value: tx_2.MsgRecvPacket.fromPartial({
                    packet,
                    proofCommitment: proofCommitments[i],
                    proofHeight,
                    signer: senderAddress,
                }),
            };
            msgs.push(msg);
        }
        this.logger.debug("MsgRecvPacket(s)", {
            msgs: msgs.map((msg) => deepCloneAndMutate(msg, (mutableMsg) => {
                mutableMsg.value.proofCommitment = toBase64AsAny(mutableMsg.value.proofCommitment);
                if (mutableMsg.value.packet?.data) {
                    mutableMsg.value.packet.data = toBase64AsAny(mutableMsg.value.packet.data);
                }
            })),
        });
        const result = await this.sign.signAndBroadcast(senderAddress, msgs, "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    acknowledgePacket(ack, proofAcked, proofHeight) {
        return this.acknowledgePackets([ack], [proofAcked], proofHeight);
    }
    async acknowledgePackets(acks, proofAckeds, proofHeight) {
        this.logger.verbose(`Acknowledge ${acks.length} packets...`);
        if (acks.length !== proofAckeds.length) {
            throw new Error(`Have ${acks.length} acks, but ${proofAckeds.length} proofs`);
        }
        if (acks.length === 0) {
            throw new Error("Must submit at least 1 ack");
        }
        const senderAddress = this.senderAddress;
        const msgs = [];
        for (const i in acks) {
            const packet = acks[i].originalPacket;
            const acknowledgement = acks[i].acknowledgement;
            this.logger.verbose(`Ack packet #${packet.sequence} from ${this.chainId}:${packet.sourceChannel}`, {
                packet: (0, utils_2.presentPacketData)(packet.data),
                ack: (0, utils_2.presentPacketData)(acknowledgement),
            });
            const msg = {
                typeUrl: "/ibc.core.channel.v1.MsgAcknowledgement",
                value: tx_2.MsgAcknowledgement.fromPartial({
                    packet,
                    acknowledgement,
                    proofAcked: proofAckeds[i],
                    proofHeight,
                    signer: senderAddress,
                }),
            };
            msgs.push(msg);
        }
        this.logger.debug("MsgAcknowledgement(s)", {
            msgs: msgs.map((msg) => deepCloneAndMutate(msg, (mutableMsg) => {
                mutableMsg.value.acknowledgement = toBase64AsAny(mutableMsg.value.acknowledgement);
                mutableMsg.value.proofAcked = toBase64AsAny(mutableMsg.value.proofAcked);
                if (mutableMsg.value.packet?.data) {
                    mutableMsg.value.packet.data = toBase64AsAny(mutableMsg.value.packet.data);
                }
            })),
        });
        const result = await this.sign.signAndBroadcast(senderAddress, msgs, "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    timeoutPacket(packet, proofUnreceived, nextSequenceRecv, proofHeight) {
        return this.timeoutPackets([packet], [proofUnreceived], [nextSequenceRecv], proofHeight);
    }
    async timeoutPackets(packets, proofsUnreceived, nextSequenceRecv, proofHeight) {
        if (packets.length !== proofsUnreceived.length) {
            throw new Error("Packets and proofs must be same length");
        }
        if (packets.length !== nextSequenceRecv.length) {
            throw new Error("Packets and sequences must be same length");
        }
        this.logger.verbose(`Timeout ${packets.length} packets...`);
        const senderAddress = this.senderAddress;
        const msgs = [];
        for (const i in packets) {
            const packet = packets[i];
            this.logger.verbose(`Timeout packet #${packet.sequence} from ${this.chainId}:${packet.sourceChannel}`, (0, utils_2.presentPacketData)(packet.data));
            const msg = {
                typeUrl: "/ibc.core.channel.v1.MsgTimeout",
                value: tx_2.MsgTimeout.fromPartial({
                    packet,
                    proofUnreceived: proofsUnreceived[i],
                    nextSequenceRecv: nextSequenceRecv[i],
                    proofHeight,
                    signer: senderAddress,
                }),
            };
            msgs.push(msg);
        }
        this.logger.debug("MsgTimeout", {
            msgs: msgs.map((msg) => deepCloneAndMutate(msg, (mutableMsg) => {
                if (mutableMsg.value.packet?.data) {
                    mutableMsg.value.packet.data = toBase64AsAny(mutableMsg.value.packet.data);
                }
                mutableMsg.value.proofUnreceived = toBase64AsAny(mutableMsg.value.proofUnreceived);
            })),
        });
        const result = await this.sign.signAndBroadcast(senderAddress, msgs, "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
    async transferTokens(sourcePort, sourceChannel, token, receiver, timeoutHeight, 
    /** timeout in seconds (SigningStargateClient converts to nanoseconds) */
    timeoutTime) {
        this.logger.verbose(`Transfer tokens to ${receiver}`);
        const result = await this.sign.sendIbcTokens(this.senderAddress, receiver, token, sourcePort, sourceChannel, timeoutHeight, timeoutTime, "auto");
        if ((0, stargate_1.isDeliverTxFailure)(result)) {
            throw new Error((0, utils_2.createDeliverTxFailureMessage)(result));
        }
        return {
            events: result.events,
            transactionHash: result.transactionHash,
            height: result.height,
        };
    }
}
exports.IbcClient = IbcClient;
// this will query for the unbonding period.
// if the trusting period is not set, it will use 2/3 of the unbonding period
async function buildCreateClientArgs(src, trustPeriodSec) {
    const header = await src.latestHeader();
    const consensusState = (0, utils_2.buildConsensusState)(header);
    const unbondingPeriodSec = await src.getUnbondingPeriod();
    if (trustPeriodSec === undefined || trustPeriodSec === null) {
        trustPeriodSec = Math.floor((unbondingPeriodSec * 2) / 3);
    }
    const clientState = (0, utils_2.buildClientState)(src.chainId, unbondingPeriodSec, trustPeriodSec, src.revisionHeight(header.height));
    return { consensusState, clientState };
}
exports.buildCreateClientArgs = buildCreateClientArgs;
async function prepareConnectionHandshake(src, dest, clientIdSrc, clientIdDest, connIdSrc) {
    // ensure the last transaction was committed to the header (one block after it was included)
    await src.waitOneBlock();
    // update client on dest
    const headerHeight = await dest.doUpdateClient(clientIdDest, src);
    // get a proof (for the proven height)
    const proof = await src.getConnectionProof(clientIdSrc, connIdSrc, headerHeight);
    return proof;
}
exports.prepareConnectionHandshake = prepareConnectionHandshake;
async function prepareChannelHandshake(src, dest, clientIdDest, portId, channelId) {
    // ensure the last transaction was committed to the header (one block after it was included)
    await src.waitOneBlock();
    // update client on dest
    const headerHeight = await dest.doUpdateClient(clientIdDest, src);
    // get a proof (for the proven height)
    const proof = await src.getChannelProof({ portId, channelId }, headerHeight);
    return { proof, version: proof.version };
}
exports.prepareChannelHandshake = prepareChannelHandshake;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWJjY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9pYmNjbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQXFEO0FBQ3JELHlEQUE4RTtBQUM5RSwrQ0FlMEI7QUFDMUIsMkRBT2dDO0FBQ2hDLHlDQUFrRTtBQUVsRSxxRUFBMkU7QUFDM0Usc0VBQWdGO0FBQ2hGLDREQVE2QztBQUM3QyxtRUFBZ0U7QUFDaEUsMkRBRzRDO0FBRTVDLCtEQUtnRDtBQUNoRCx1RkFJZ0U7QUFDaEUsK0RBSzZDO0FBQzdDLHVFQUF1RTtBQUV2RSxxQ0FBOEM7QUFDOUMsdUNBQWdFO0FBQ2hFLG1DQVdpQjtBQVFqQixTQUFTLGtCQUFrQixDQUN6QixNQUFTLEVBQ1QsUUFBdUM7SUFFdkMsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFM0IsT0FBTyxnQkFBZ0IsQ0FBQztBQUMxQixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsR0FBRyxLQUFrQztJQUMxRCxPQUFPLElBQUEsbUJBQVEsRUFBQyxHQUFHLEtBQUssQ0FBUSxDQUFDLENBQUMseURBQXlEO0FBQzdGLENBQUM7QUFFRCxvREFBb0Q7QUFDcEQsbUZBQW1GO0FBQ25GLG1DQUFtQztBQUNuQywwQ0FBMEM7QUFDMUMsdURBQXVEO0FBQ3ZELHlDQUF5QztBQUN6Qyw4Q0FBOEM7QUFFOUMsK0NBQStDO0FBQy9DLE1BQU0sbUJBQW1CLEdBQUc7SUFDMUIsU0FBUyxFQUFFLElBQUEsa0JBQU8sRUFBQyxLQUFLLENBQUM7Q0FDMUIsQ0FBQztBQUNGLE1BQU0sd0JBQXdCLEdBQVk7SUFDeEMsVUFBVSxFQUFFLEdBQUc7SUFDZixRQUFRLEVBQUUsQ0FBQyxlQUFlLEVBQUUsaUJBQWlCLENBQUM7Q0FDL0MsQ0FBQztBQUNGLGdEQUFnRDtBQUNoRCxNQUFNLGtCQUFrQixH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