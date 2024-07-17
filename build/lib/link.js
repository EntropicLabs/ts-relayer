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
        const proof = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, srcChannelId);
        const { channelId: channelIdDest } = await dest.client.channelOpenTry(destPort, { portId: srcPort, channelId: srcChannelId }, ordering, dest.connectionID, version, version, proof);
        // ack on src
        const proofAck = await (0, ibcclient_1.prepareChannelHandshake)(dest.client, src.client, src.clientID, destPort, channelIdDest);
        await src.client.channelOpenAck(srcPort, srcChannelId, channelIdDest, version, proofAck);
        // confirm on dest
        const proofConfirm = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, srcChannelId);
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
        const proof = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, channelIdSrc);
        const { channelId: channelIdDest } = await dest.client.channelOpenTry(destPort, { portId: srcPort, channelId: channelIdSrc }, ordering, dest.connectionID, version, version, proof);
        // ack on src
        const proofAck = await (0, ibcclient_1.prepareChannelHandshake)(dest.client, src.client, src.clientID, destPort, channelIdDest);
        await src.client.channelOpenAck(srcPort, channelIdSrc, channelIdDest, version, proofAck);
        // confirm on dest
        const proofConfirm = await (0, ibcclient_1.prepareChannelHandshake)(src.client, dest.client, dest.clientID, srcPort, channelIdSrc);
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