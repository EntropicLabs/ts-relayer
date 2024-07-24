"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.otherSide = void 0;
const utils_1 = require("@cosmjs/utils");
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const endpoint_1 = require("./endpoint");
const ibcclient_1 = require("./ibcclient");
const logger_1 = require("./logger");
const utils_2 = require("./utils");
function otherSide(side) {
    if (side === "A") {
        return "B";
    }
    else {
        return "A";
    }
}
exports.otherSide = otherSide;
/**
 * Link represents a Connection between a pair of blockchains (Nodes).
 * An initialized Link requires a both sides to have a Client for the remote side
 * as well as an established Connection using those Clients. Channels can be added
 * and removed to a Link. There are constructors to find/create the basic requirements
 * if you don't know the client/connection IDs a priori.
 */
class Link {
    chain(side) {
        if (side === "A") {
            return this.chainA;
        }
        else {
            return this.chainB;
        }
    }
    setFilter(filter) {
        this.packetFilter = filter;
    }
    clearFilter() {
        this.packetFilter = null;
    }
    otherChain(side) {
        if (side === "A") {
            return this.chainB;
        }
        else {
            return this.chainA;
        }
    }
    /**
     * findConnection attempts to reuse an existing Client/Connection.
     * If none exists, then it returns an error.
     *
     * @param nodeA
     * @param nodeB
     */
    static async createWithExistingConnections(nodeA, nodeB, connA, connB, logger) {
        const [chainA, chainB] = [nodeA.chainId, nodeB.chainId];
        const [{ connection: connectionA }, { connection: connectionB }] = await Promise.all([
            nodeA.query.ibc.connection.connection(connA),
            nodeB.query.ibc.connection.connection(connB),
        ]);
        if (!connectionA) {
            throw new Error(`[${chainA}] Connection not found for ID ${connA}`);
        }
        if (!connectionB) {
            throw new Error(`[${chainB}] Connection not found for ID ${connB}`);
        }
        if (!connectionA.counterparty) {
            throw new Error(`[${chainA}] Counterparty not found for connection with ID ${connA}`);
        }
        if (!connectionB.counterparty) {
            throw new Error(`[${chainB}] Counterparty not found for connection with ID ${connB}`);
        }
        // ensure the connection is open
        if (connectionA.state != channel_1.State.STATE_OPEN) {
            throw new Error(`Connection on ${chainA} must be in state open, it has state ${connectionA.state}`);
        }
        if (connectionB.state != channel_1.State.STATE_OPEN) {
            throw new Error(`Connection on ${chainB} must be in state open, it has state ${connectionB.state}`);
        }
        const [clientIdA, clientIdB] = [connectionA.clientId, connectionB.clientId];
        if (clientIdA !== connectionB.counterparty.clientId) {
            throw new Error(`Client ID ${connectionA.clientId} for connection with ID ${connA} does not match counterparty client ID ${connectionB.counterparty.clientId} for connection with ID ${connB}`);
        }
        if (clientIdB !== connectionA.counterparty.clientId) {
            throw new Error(`Client ID ${connectionB.clientId} for connection with ID ${connB} does not match counterparty client ID ${connectionA.counterparty.clientId} for connection with ID ${connA}`);
        }
        const [clientStateA, clientStateB] = await Promise.all([
            nodeA.query.ibc.client.stateTm(clientIdA),
            nodeB.query.ibc.client.stateTm(clientIdB),
        ]);
        if (nodeA.chainId !== clientStateB.chainId) {
            throw new Error(`Chain ID ${nodeA.chainId} for connection with ID ${connA} does not match remote chain ID ${clientStateA.chainId}`);
        }
        if (nodeB.chainId !== clientStateA.chainId) {
            throw new Error(`Chain ID ${nodeB.chainId} for connection with ID ${connB} does not match remote chain ID ${clientStateB.chainId}`);
        }
        const endA = new endpoint_1.Endpoint(nodeA, clientIdA, connA);
        const endB = new endpoint_1.Endpoint(nodeB, clientIdB, connB);
        const link = new Link(endA, endB, logger);
        await Promise.all([
            link.assertHeadersMatchConsensusState("A", clientIdA, clientStateA.latestHeight),
            link.assertHeadersMatchConsensusState("B", clientIdB, clientStateB.latestHeight),
        ]);
        return link;
    }
    /**
     * we do this assert inside createWithExistingConnections, but it could be a useful check
     * for submitting double-sign evidence later
     *
     * @param proofSide the side holding the consensus proof, we check the header from the other side
     * @param height the height of the consensus state and header we wish to compare
     */
    async assertHeadersMatchConsensusState(proofSide, clientId, height) {
        const { src, dest } = this.getEnds(proofSide);
        // Check headers match consensus state (at least validators)
        const [consensusState, header] = await Promise.all([
            src.client.query.ibc.client.consensusStateTm(clientId, height),
            dest.client.header((0, utils_2.toIntHeight)(height)),
        ]);
        // ensure consensus and headers match for next validator hashes
        if (!(0, utils_1.arrayContentEquals)(consensusState.nextValidatorsHash, header.nextValidatorsHash)) {
            throw new Error(`NextValidatorHash doesn't match ConsensusState.`);
        }
        // ensure the committed apphash matches the actual node we have
        const hash = consensusState.root?.hash;
        if (!hash) {
            throw new Error(`ConsensusState.root.hash missing.`);
        }
        if (!(0, utils_1.arrayContentEquals)(hash, header.appHash)) {
            throw new Error(`AppHash doesn't match ConsensusState.`);
        }
    }
    /**
     * createConnection will always create a new pair of clients and a Connection between the
     * two sides
     *
     * @param nodeA
     * @param nodeB
     */
    static async createWithNewConnections(nodeA, nodeB, logger, 
    // number of seconds the client (on B pointing to A) is valid without update
    trustPeriodA, 
    // number of seconds the client (on A pointing to B) is valid without update
    trustPeriodB) {
        const [clientIdA, clientIdB] = await createClients(nodeA, nodeB, trustPeriodA, trustPeriodB);
        // wait a block to ensure we have proper proofs for creating a connection (this has failed on CI before)
        await Promise.all([nodeA.waitOneBlock(), nodeB.waitOneBlock()]);
        // connectionInit on nodeA
        const { connectionId: connIdA } = await nodeA.connOpenInit(clientIdA, clientIdB);
        // connectionTry on nodeB
        const proof = await (0, ibcclient_1.prepareConnectionHandshake)(nodeA, nodeB, clientIdA, clientIdB, connIdA);
        const { connectionId: connIdB } = await nodeB.connOpenTry(clientIdB, proof);
        // connectionAck on nodeA
        const proofAck = await (0, ibcclient_1.prepareConnectionHandshake)(nodeB, nodeA, clientIdB, clientIdA, connIdB);
        await nodeA.connOpenAck(connIdA, proofAck);
        // connectionConfirm on dest
        const proofConfirm = await (0, ibcclient_1.prepareConnectionHandshake)(nodeA, nodeB, clientIdA, clientIdB, connIdA);
        await nodeB.connOpenConfirm(connIdB, proofConfirm);
        const endA = new endpoint_1.Endpoint(nodeA, clientIdA, connIdA);
        const endB = new endpoint_1.Endpoint(nodeB, clientIdB, connIdB);
        return new Link(endA, endB, logger);
    }
    // you can use this if you already have the info out of bounds
    // FIXME: check the validity of that data?
    constructor(endA, endB, logger) {
        this.packetFilter = null;
        this.endA = endA;
        this.endB = endB;
        this.logger = logger ?? new logger_1.NoopLogger();
        this.chainA = endA.client.chainId;
        this.chainB = endB.client.chainId;
    }
    /**
     * Writes the latest header from the sender chain to the other endpoint
     *
     * @param sender Which side we get the header/commit from
     * @returns header height (from sender) that is now known on dest
     *
     * Relayer binary should call this from a heartbeat which checks if needed and updates.
     * Just needs trusting period on both side
     */
    async updateClient(sender) {
        this.logger.info(`Update Client on ${this.otherChain(sender)}`);
        const { src, dest } = this.getEnds(sender);
        const height = await dest.client.doUpdateClient(dest.clientID, src.client);
        return height;
    }
    /**
     * Checks if the last proven header on the destination is older than maxAge,
     * and if so, update the client. Returns the new client height if updated,
     * or null if no update needed
     *
     * @param sender
     * @param maxAge
     */
    async updateClientIfStale(sender, maxAge) {
        this.logger.verbose(`Checking if ${this.otherChain(sender)} has recent header of ${this.chain(sender)}`);
        const { src, dest } = this.getEnds(sender);
        const knownHeader = await dest.client.query.ibc.client.consensusStateTm(dest.clientID);
        const currentHeader = await src.client.latestHeader();
        // quit now if we don't need to update
        const knownSeconds = Number(knownHeader.timestamp?.seconds);
        if (knownSeconds) {
            const curSeconds = Number((0, utils_2.timestampFromDateNanos)(currentHeader.time).seconds);
            if (curSeconds - knownSeconds < maxAge) {
                return null;
            }
        }
        // otherwise, do the update
        return this.updateClient(sender);
    }
    /**
     * Ensures the dest has a proof of at least minHeight from source.
     * Will not execute any tx if not needed.
     * Will wait a block if needed until the header is available.
     *
     * Returns the latest header height now available on dest
     */
    async updateClientToHeight(source, minHeight) {
        this.logger.info(`Check whether client on ${this.otherChain(source)} >= height ${minHeight}`);
        const { src, dest } = this.getEnds(source);
        const client = await dest.client.query.ibc.client.stateTm(dest.clientID);
        // TODO: revisit where revision number comes from - this must be the number from the source chain
        const knownHeight = Number(client.latestHeight?.revisionHeight ?? 0);
        if (knownHeight >= minHeight && client.latestHeight !== undefined) {
            return client.latestHeight;
        }
        const curHeight = (await src.client.latestHeader()).height;
        if (curHeight < minHeight) {
            await src.client.waitOneBlock();
        }
        return this.updateClient(source);
    }
    // Try to open a channel that has already been initialized on the source chain
    async openInitializedChannel(sender, srcChannelId, srcPort, destPort, ordering, version) {
        this.logger.info(`Create channel with sender ${this.chain(sender)}: ${srcPort} => ${destPort}`);
        const { src, dest } = this.getEnds(sender);
        // try on dest
        const { proof } = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, srcChannelId);
        const { channelId: channelIdDest } = await dest.client.channelOpenTry(destPort, { portId: srcPort, channelId: srcChannelId }, ordering, dest.connectionID, version, version, proof);
        // ack on src
        const { proof: proofAck, version: versionAck } = await (0, ibcclient_1.prepareChannelHandshake)(dest.client, src.client, src.clientID, destPort, channelIdDest);
        await src.client.channelOpenAck(srcPort, srcChannelId, channelIdDest, versionAck ?? version, proofAck);
        // confirm on dest
        const { proof: proofConfirm } = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, srcChannelId);
        await dest.client.channelOpenConfirm(destPort, channelIdDest, proofConfirm);
        return {
            src: {
                portId: srcPort,
                channelId: srcChannelId,
            },
            dest: {
                portId: destPort,
                channelId: channelIdDest,
            },
        };
    }
    async createChannel(sender, srcPort, destPort, ordering, version) {
        this.logger.info(`Create channel with sender ${this.chain(sender)}: ${srcPort} => ${destPort}`);
        const { src, dest } = this.getEnds(sender);
        // init on src
        const { channelId: channelIdSrc } = await src.client.channelOpenInit(srcPort, destPort, ordering, src.connectionID, version);
        // try on dest
        const { proof } = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, channelIdSrc);
        const { channelId: channelIdDest } = await dest.client.channelOpenTry(destPort, { portId: srcPort, channelId: channelIdSrc }, ordering, dest.connectionID, version, version, proof);
        // ack on src
        const { proof: proofAck, version: versionAck } = await (0, ibcclient_1.prepareChannelHandshake)(dest.client, src.client, src.clientID, destPort, channelIdDest);
        await src.client.channelOpenAck(srcPort, channelIdSrc, channelIdDest, versionAck ?? version, proofAck);
        // confirm on dest
        const { proof: proofConfirm } = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, channelIdSrc);
        await dest.client.channelOpenConfirm(destPort, channelIdDest, proofConfirm);
        return {
            src: {
                portId: srcPort,
                channelId: channelIdSrc,
            },
            dest: {
                portId: destPort,
                channelId: channelIdDest,
            },
        };
    }
    /**
     * This is a variant of checkAndRelayPacketsAndAcks designed for integration tests.
     * It doesn't have the optimizations of the other variant, as this is designed for low-traffic
     * CI or devnet environments.
     * It does, however, return all the acknowledgements, so we can check for
     */
    async relayAll() {
        const result = await this.doCheckAndRelay({});
        return result.info;
    }
    /**
     * This will check both sides for pending packets and relay them.
     * It will then relay all acks (previous and generated by the just-submitted packets).
     * If pending packets have timed out, it will submit a timeout instead of attempting to relay them.
     *
     * Returns the most recent heights it relay, which can be used as a start for the next round
     */
    async checkAndRelayPacketsAndAcks(relayFrom, timedoutThresholdBlocks = 0, timedoutThresholdSeconds = 0) {
        const { heights } = await this.doCheckAndRelay(relayFrom, timedoutThresholdBlocks, timedoutThresholdSeconds);
        this.logger.verbose("next heights to relay", heights); // eslint-disable-line @typescript-eslint/no-explicit-any
        return heights;
    }
    async doCheckAndRelay(relayFrom, timedoutThresholdBlocks = 0, timedoutThresholdSeconds = 0) {
        // FIXME: is there a cleaner way to get the height we query at?
        const [packetHeightA, packetHeightB, packetsA, packetsB] = await Promise.all([
            this.endA.client.currentHeight(),
            this.endB.client.currentHeight(),
            this.getPendingPackets("A", { minHeight: relayFrom.packetHeightA }),
            this.getPendingPackets("B", { minHeight: relayFrom.packetHeightB }),
        ]);
        const filteredPacketsA = this.packetFilter !== null
            ? packetsA.filter((packet) => this.packetFilter?.(packet.packet))
            : packetsA;
        const filteredPacketsB = this.packetFilter !== null
            ? packetsB.filter((packet) => this.packetFilter?.(packet.packet))
            : packetsB;
        const cutoffHeightA = await this.endB.client.timeoutHeight(timedoutThresholdBlocks);
        const cutoffTimeA = (0, utils_2.secondsFromDateNanos)(await this.endB.client.currentTime()) +
            timedoutThresholdSeconds;
        const { toSubmit: submitA, toTimeout: timeoutA } = (0, utils_2.splitPendingPackets)(cutoffHeightA, cutoffTimeA, filteredPacketsA);
        const cutoffHeightB = await this.endA.client.timeoutHeight(timedoutThresholdBlocks);
        const cutoffTimeB = (0, utils_2.secondsFromDateNanos)(await this.endA.client.currentTime()) +
            timedoutThresholdSeconds;
        const { toSubmit: submitB, toTimeout: timeoutB } = (0, utils_2.splitPendingPackets)(cutoffHeightB, cutoffTimeB, filteredPacketsB);
        // FIXME: use the returned acks first? Then query for others?
        await Promise.all([
            this.relayPackets("A", submitA),
            this.relayPackets("B", submitB),
        ]);
        // let's wait a bit to ensure our newly committed acks are indexed
        await Promise.all([
            this.endA.client.waitForIndexer(),
            this.endB.client.waitForIndexer(),
        ]);
        const [ackHeightA, ackHeightB, acksA, acksB] = await Promise.all([
            this.endA.client.currentHeight(),
            this.endB.client.currentHeight(),
            this.getPendingAcks("A", { minHeight: relayFrom.ackHeightA }),
            this.getPendingAcks("B", { minHeight: relayFrom.ackHeightB }),
        ]);
        await Promise.all([this.relayAcks("A", acksA), this.relayAcks("B", acksB)]);
        await Promise.all([
            this.timeoutPackets("A", timeoutA),
            this.timeoutPackets("B", timeoutB),
        ]);
        const heights = {
            packetHeightA,
            packetHeightB,
            ackHeightA,
            ackHeightB,
        };
        const info = {
            packetsFromA: packetsA.length,
            packetsFromB: packetsB.length,
            acksFromA: acksA,
            acksFromB: acksB,
        };
        return { heights, info };
    }
    async getPendingPackets(source, opts = {}) {
        this.logger.verbose(`Get pending packets on ${this.chain(source)}`);
        const { src, dest } = this.getEnds(source);
        const allPackets = await src.querySentPackets(opts);
        const toFilter = allPackets.map(({ packet }) => packet);
        const query = async (port, channel, sequences) => {
            const res = await dest.client.query.ibc.channel.unreceivedPackets(port, channel, sequences);
            return res.sequences.map((seq) => Number(seq));
        };
        // This gets the subset of packets that were already processed on the receiving chain
        const unreceived = await this.filterUnreceived(toFilter, query, packetId);
        const unreceivedPackets = allPackets.filter(({ packet }) => unreceived[packetId(packet)].has(Number(packet.sequence)));
        // However, some of these may have already been submitted as timeouts on the source chain. Check and filter
        const valid = await Promise.all(unreceivedPackets.map(async (packet) => {
            const { sourcePort, sourceChannel, sequence } = packet.packet;
            try {
                // this throws an error if no commitment there
                await src.client.query.ibc.channel.packetCommitment(sourcePort, sourceChannel, sequence);
                return packet;
            }
            catch {
                return undefined;
            }
        }));
        return valid.filter(utils_1.isDefined);
    }
    async getPendingAcks(source, opts = {}) {
        this.logger.verbose(`Get pending acks on ${this.chain(source)}`);
        const { src, dest } = this.getEnds(source);
        const allAcks = await src.queryWrittenAcks(opts);
        const filteredAcks = this.packetFilter !== null
            ? allAcks.filter((ack) => this.packetFilter?.(ack.originalPacket))
            : allAcks;
        const toFilter = filteredAcks.map(({ originalPacket }) => originalPacket);
        const query = async (port, channel, sequences) => {
            const res = await dest.client.query.ibc.channel.unreceivedAcks(port, channel, sequences);
            return res.sequences.map((seq) => Number(seq));
        };
        const unreceived = await this.filterUnreceived(toFilter, query, ackId);
        return filteredAcks.filter(({ originalPacket: packet }) => unreceived[ackId(packet)].has(Number(packet.sequence)));
    }
    async filterUnreceived(packets, unreceivedQuery, idFunc) {
        if (packets.length === 0) {
            return {};
        }
        const packetsPerDestination = packets.reduce((sorted, packet) => {
            const key = idFunc(packet);
            return {
                ...sorted,
                [key]: [...(sorted[key] ?? []), Number(packet.sequence)],
            };
        }, {});
        const unreceivedResponses = await Promise.all(Object.entries(packetsPerDestination).map(async ([destination, sequences]) => {
            const [port, channel] = destination.split(idDelim);
            const notfound = await unreceivedQuery(port, channel, sequences);
            return { key: destination, sequences: notfound };
        }));
        const unreceived = unreceivedResponses.reduce((nested, { key, sequences }) => {
            return {
                ...nested,
                [key]: new Set(sequences),
            };
        }, {});
        return unreceived;
    }
    // Returns the last height that this side knows of the other blockchain
    async lastKnownHeader(side) {
        this.logger.verbose(`Get last known header on ${this.chain(side)}`);
        const { src } = this.getEnds(side);
        const client = await src.client.query.ibc.client.stateTm(src.clientID);
        return Number(client.latestHeight?.revisionHeight ?? 0);
    }
    // this will update the client if needed and relay all provided packets from src -> dest
    // if packets are all older than the last consensusHeight, then we don't update the client.
    //
    // Returns all the acks that are associated with the just submitted packets
    async relayPackets(source, packets) {
        this.logger.info(`Relay ${packets.length} packets from ${this.chain(source)} => ${this.otherChain(source)}`);
        if (packets.length === 0) {
            return [];
        }
        const { src, dest } = this.getEnds(source);
        // check if we need to update client at all
        const neededHeight = Math.max(...packets.map((x) => x.height)) + 1;
        const headerHeight = await this.updateClientToHeight(source, neededHeight);
        const submit = packets.map(({ packet }) => packet);
        const proofs = await Promise.all(submit.map((packet) => src.client.getPacketProof(packet, headerHeight)));
        const { events, height, transactionHash } = await dest.client.receivePackets(submit, proofs, headerHeight);
        const acks = (0, utils_2.parseAcksFromTxEvents)(events);
        return acks.map((ack) => ({
            height,
            txHash: transactionHash,
            txEvents: events,
            ...ack,
        }));
    }
    // this will update the client if needed and relay all provided acks from src -> dest
    // (yes, dest is where the packet was sent, but the ack was written on src).
    // if acks are all older than the last consensusHeight, then we don't update the client.
    //
    // Returns the block height the acks were included in, or null if no acks sent
    async relayAcks(source, acks) {
        this.logger.info(`Relay ${acks.length} acks from ${this.chain(source)} => ${this.otherChain(source)}`);
        if (acks.length === 0) {
            return null;
        }
        const { src, dest } = this.getEnds(source);
        // check if we need to update client at all
        const neededHeight = Math.max(...acks.map((x) => x.height)) + 1;
        const headerHeight = await this.updateClientToHeight(source, neededHeight);
        const proofs = await Promise.all(acks.map((ack) => src.client.getAckProof(ack, headerHeight)));
        const { height } = await dest.client.acknowledgePackets(acks, proofs, headerHeight);
        return height;
    }
    // Source: the side that originally sent the packet
    // We need to relay a proof from dest -> source
    async timeoutPackets(source, packets) {
        this.logger.info(`Timeout ${packets.length} packets sent from ${this.chain(source)}`);
        if (packets.length === 0) {
            return null;
        }
        const { src, dest } = this.getEnds(source);
        const destSide = otherSide(source);
        // We need a header that is after the timeout, not after the packet was committed
        // This can get complex with timeout timestamps. Let's just update to latest
        await dest.client.waitOneBlock();
        const headerHeight = await this.updateClient(destSide);
        const rawPackets = packets.map(({ packet }) => packet);
        const proofAndSeqs = await Promise.all(rawPackets.map(async (packet) => {
            const fakeAck = {
                originalPacket: packet,
                acknowledgement: new Uint8Array(),
            };
            const { nextSequenceReceive: sequence } = await dest.client.query.ibc.channel.nextSequenceReceive(packet.destinationPort, packet.destinationChannel);
            const proof = await dest.client.getTimeoutProof(fakeAck, headerHeight);
            return { proof, sequence };
        }));
        const proofs = proofAndSeqs.map(({ proof }) => proof);
        const seqs = proofAndSeqs.map(({ sequence }) => sequence);
        const { height } = await src.client.timeoutPackets(rawPackets, proofs, seqs, headerHeight);
        return height;
    }
    getEnds(src) {
        if (src === "A") {
            return {
                src: this.endA,
                dest: this.endB,
            };
        }
        else {
            return {
                src: this.endB,
                dest: this.endA,
            };
        }
    }
}
exports.Link = Link;
const idDelim = ":";
const packetId = (packet) => `${packet.destinationPort}${idDelim}${packet.destinationChannel}`;
const ackId = (packet) => `${packet.sourcePort}${idDelim}${packet.sourceChannel}`;
async function createClients(nodeA, nodeB, 
// number of seconds the client (on B pointing to A) is valid without update
trustPeriodA, 
// number of seconds the client (on A pointing to B) is valid without update
trustPeriodB) {
    // client on B pointing to A
    const args = await (0, ibcclient_1.buildCreateClientArgs)(nodeA, trustPeriodA);
    const { clientId: clientIdB } = await nodeB.createTendermintClient(args.clientState, args.consensusState);
    // client on A pointing to B
    const args2 = await (0, ibcclient_1.buildCreateClientArgs)(nodeB, trustPeriodB);
    const { clientId: clientIdA } = await nodeA.createTendermintClient(args2.clientState, args2.consensusState);
    return [clientIdA, clientIdB];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvbGluay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5Q0FBOEQ7QUFDOUQsc0VBQWdGO0FBR2hGLHlDQUtvQjtBQUNwQiwyQ0FNcUI7QUFDckIscUNBQThDO0FBQzlDLG1DQU1pQjtBQVFqQixTQUFnQixTQUFTLENBQUMsSUFBVTtJQUNsQyxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7UUFDaEIsT0FBTyxHQUFHLENBQUM7S0FDWjtTQUFNO1FBQ0wsT0FBTyxHQUFHLENBQUM7S0FDWjtBQUNILENBQUM7QUFORCw4QkFNQztBQXdCRDs7Ozs7O0dBTUc7QUFDSCxNQUFhLElBQUk7SUFTUCxLQUFLLENBQUMsSUFBVTtRQUN0QixJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7WUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3BCO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDcEI7SUFDSCxDQUFDO0lBRU0sU0FBUyxDQUFDLE1BQW9CO1FBQ25DLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO0lBQzdCLENBQUM7SUFFTSxXQUFXO1FBQ2hCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFFTyxVQUFVLENBQUMsSUFBVTtRQUMzQixJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7WUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3BCO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDcEI7SUFDSCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FDL0MsS0FBZ0IsRUFDaEIsS0FBZ0IsRUFDaEIsS0FBYSxFQUNiLEtBQWEsRUFDYixNQUFlO1FBRWYsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFD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