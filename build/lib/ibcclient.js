"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareChannelHandshake = exports.prepareConnectionHandshake = exports.buildCreateClientArgs = exports.IbcClient = void 0;
const encoding_1 = require("@cosmjs/encoding");
const math_1 = require("@cosmjs/math");
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
        this.granterAddress = options.granter;
    }
    async calculateFee(messages, memo) {
        const gasEstimation = await this.sign.simulate(this.senderAddress, messages, memo);
        const gasLimit = Math.round(gasEstimation * 1.4);
        const { denom, amount: gasPriceAmount } = this.gasPrice;
        const amount = gasPriceAmount
            .multiply(new math_1.Uint53(gasLimit))
            .ceil()
            .toString();
        return {
            amount: (0, proto_signing_1.coins)(amount, denom),
            gas: gasLimit.toString(),
            granter: this.granterAddress,
        };
    }
    async signAndBroadcast(messages, memo) {
        const fee = await this.calculateFee(messages, memo);
        return this.sign.signAndBroadcast(this.senderAddress, messages, fee, memo);
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
        const sendMsg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: this.senderAddress,
                toAddress: recipientAddress,
                amount: transferAmount,
            },
        };
        const result = await this.signAndBroadcast([sendMsg], memo);
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
        const result = await this.signAndBroadcast(msgs);
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
        const result = await this.signAndBroadcast([createMsg]);
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
        const result = await this.signAndBroadcast([updateMsg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast([msg]);
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
        const result = await this.signAndBroadcast(msgs);
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
        const result = await this.signAndBroadcast(msgs);
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
        const result = await this.signAndBroadcast(msgs);
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
        const timeoutTimestampNanoseconds = timeoutTime
            ? BigInt(timeoutTime) * BigInt(1000000000)
            : undefined;
        const transferMsg = {
            typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
            value: tx_1.MsgTransfer.fromPartial({
                sourcePort,
                sourceChannel,
                sender: this.senderAddress,
                receiver,
                token,
                timeoutHeight,
                timeoutTimestamp: timeoutTimestampNanoseconds,
            }),
        };
        const result = await this.signAndBroadcast([transferMsg]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWJjY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9pYmNjbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQXFEO0FBQ3JELHVDQUFzQztBQUN0Qyx5REFLK0I7QUFDL0IsK0NBbUIwQjtBQUMxQiwyREFPZ0M7QUFDaEMseUNBQWtFO0FBRWxFLHFFQUEyRTtBQUMzRSxzRUFBZ0Y7QUFDaEYsNERBUTZDO0FBQzdDLG1FQUFnRTtBQUNoRSwyREFHNEM7QUFFNUMsK0RBS2dEO0FBQ2hELHVGQUlnRTtBQUNoRSwrREFLNkM7QUFDN0MsdUVBQXVFO0FBRXZFLHFDQUE4QztBQUM5Qyx1Q0FBZ0U7QUFDaEUsbUNBV2lCO0FBT2pCLFNBQVMsa0JBQWtCLENBQ3pCLE1BQVMsRUFDVCxRQUF1QztJQUV2QyxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUUzQixPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxHQUFHLEtBQWtDO0lBQzFELE9BQU8sSUFBQSxtQkFBUSxFQUFDLEdBQUcsS0FBSyxDQUFRLENBQUMsQ0FBQyx5REFBeUQ7QUFDN0YsQ0FBQztBQUVELG9EQUFvRDtBQUNwRCxtRkFBbUY7QUFDbkYsbUNBQW1DO0FBQ25DLDBDQUEwQztBQUMxQyx1REFBdUQ7QUFDdkQseUNBQXlDO0FBQ3pDLDhDQUE4QztBQUU5QywrQ0FBK0M7QUFDL0MsTUFBTSxtQkFBbUIsR0FBRztJQUMxQixTQUFTLEVBQUUsSUFBQSxrQkFBTyxFQUFDLEtBQUssQ0FBQztDQUMxQixDQUFDO0FBQ0YsTUFBTSx3QkFBd0IsR0FBWTtJQUN4QyxVQUFVLEVBQUUsR0FBRztJQUNmLFFBQVEsRUFBRSxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQztDQUMvQyxDQUFDO0FBQ0YsZ0RBQWdEO0FBQ2hE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