"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@cosmjs/utils");
const ava_1 = __importDefault(require("ava"));
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const helpers_1 = require("./helpers");
const ibcclient_1 = require("./ibcclient");
const link_1 = require("./link");
const utils_2 = require("./utils");
ava_1.default.serial("establish new client-connection", async (t) => {
    const logger = new helpers_1.TestLogger();
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const link = await link_1.Link.createWithNewConnections(src, dest, logger);
    // ensure the data makes sense (TODO: more?)
    t.assert(link.endA.clientID.startsWith("07-tendermint-"), link.endA.clientID);
    t.assert(link.endB.clientID.startsWith("07-tendermint-"), link.endB.clientID);
    // try to update both clients, ensuring this connection is stable
    await link.updateClient("A");
    // TODO: ensure it is updated
    await link.updateClient("B");
    // TODO: ensure it is updated
    t.assert(logger.info.calledTwice, logger.info.callCount.toString());
});
ava_1.default.serial("initialized connection and start channel handshake", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const link = await link_1.Link.createWithNewConnections(src, dest);
    // reject channels with invalid ports
    await t.throwsAsync(() => src.channelOpenInit(helpers_1.wasmd.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, link.endA.connectionID, helpers_1.ics20.version));
    // we need to wait a block for a new checkTx state, and proper sequences
    await src.waitOneBlock();
    // reject channels with invalid version
    await t.throwsAsync(() => src.channelOpenInit(helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, link.endA.connectionID, "ics27"));
    // we need to wait a block for a new checkTx state, and proper sequences
    await src.waitOneBlock();
    // this is valid and works
    const { channelId: channelIdSrc } = await src.channelOpenInit(helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, link.endA.connectionID, helpers_1.ics20.version);
    t.assert(channelIdSrc.startsWith("channel-"), channelIdSrc);
});
ava_1.default.serial("automated channel handshake on initialized connection", async (t) => {
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB);
    // increment the channel sequence on src, to guarantee unique ids
    await nodeA.channelOpenInit(helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, link.endA.connectionID, helpers_1.ics20.version);
    // open a channel
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    // ensure we bound expected ports
    t.is(channels.src.portId, helpers_1.gaia.ics20Port);
    t.is(channels.dest.portId, helpers_1.wasmd.ics20Port);
    // and have different channel ids (this depends on the increment above)
    t.not(channels.src.channelId, channels.dest.channelId);
    // query data
    const { channel } = await link.endB.client.query.ibc.channel.channel(helpers_1.wasmd.ics20Port, channels.dest.channelId);
    t.is(channel?.state, channel_1.State.STATE_OPEN);
    t.is(channel?.ordering, helpers_1.ics20.ordering);
    t.is(channel?.counterparty?.channelId, channels.src.channelId);
});
// createWithExistingConnections
ava_1.default.serial("reuse existing connections", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const oldLink = await link_1.Link.createWithNewConnections(src, dest);
    const connA = oldLink.endA.connectionID;
    const connB = oldLink.endB.connectionID;
    const oldChannels = await oldLink.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    const newLink = await link_1.Link.createWithExistingConnections(src, dest, connA, connB);
    const channelSrc = await newLink.endA.client.query.ibc.channel.channel(helpers_1.gaia.ics20Port, oldChannels.src.channelId);
    t.is(channelSrc.channel?.state, channel_1.State.STATE_OPEN);
    t.is(channelSrc.channel?.ordering, helpers_1.ics20.ordering);
    t.is(channelSrc.channel?.counterparty?.channelId, oldChannels.dest.channelId);
    const channelDest = await newLink.endB.client.query.ibc.channel.channel(helpers_1.wasmd.ics20Port, oldChannels.dest.channelId);
    t.is(channelDest.channel?.state, channel_1.State.STATE_OPEN);
    t.is(channelDest.channel?.ordering, helpers_1.ics20.ordering);
    t.is(channelDest.channel?.counterparty?.channelId, oldChannels.src.channelId);
    // Check everything is fine by creating a new channel
    // switch src and dest just to test another path
    const newChannels = await newLink.createChannel("B", helpers_1.wasmd.ics20Port, helpers_1.gaia.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    t.notDeepEqual(newChannels.dest, oldChannels.src);
});
ava_1.default.serial("reuse existing connections with partially open channel", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const oldLink = await link_1.Link.createWithNewConnections(src, dest);
    const connA = oldLink.endA.connectionID;
    const connB = oldLink.endB.connectionID;
    const { channelId: srcChannelId } = await src.channelOpenInit(helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, connA, helpers_1.ics20.version);
    const proof = await (0, ibcclient_1.prepareChannelHandshake)(src, dest, oldLink.endB.clientID, helpers_1.gaia.ics20Port, srcChannelId);
    const { channelId: destChannelId } = await dest.channelOpenTry(helpers_1.wasmd.ics20Port, { portId: helpers_1.gaia.ics20Port, channelId: srcChannelId }, helpers_1.ics20.ordering, connB, helpers_1.ics20.version, helpers_1.ics20.version, proof);
    const newLink = await link_1.Link.createWithExistingConnections(src, dest, connA, connB);
    const channelSrc = await newLink.endA.client.query.ibc.channel.channel(helpers_1.gaia.ics20Port, srcChannelId);
    t.is(channelSrc.channel?.state, channel_1.State.STATE_INIT);
    t.is(channelSrc.channel?.ordering, helpers_1.ics20.ordering);
    // Counterparty channel ID not yet known
    t.is(channelSrc.channel?.counterparty?.channelId, "");
    const channelDest = await newLink.endB.client.query.ibc.channel.channel(helpers_1.wasmd.ics20Port, destChannelId);
    t.is(channelDest.channel?.state, channel_1.State.STATE_TRYOPEN);
    t.is(channelDest.channel?.ordering, helpers_1.ics20.ordering);
    t.is(channelDest.channel?.counterparty?.channelId, srcChannelId);
    // Check everything is fine by creating a new channel
    // switch src and dest just to test another path
    const newChannels = await newLink.createChannel("B", helpers_1.wasmd.ics20Port, helpers_1.gaia.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    t.notDeepEqual(newChannels.dest, {
        portId: helpers_1.gaia.ics20Port,
        channelId: srcChannelId,
    });
});
ava_1.default.serial("errors when reusing an invalid connection", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    // Make sure valid connections do exist
    await link_1.Link.createWithNewConnections(src, dest);
    const connA = "whatever";
    const connB = "unreal";
    await t.throwsAsync(() => link_1.Link.createWithExistingConnections(src, dest, connA, connB));
});
ava_1.default.serial(`errors when reusing connections on the same node`, async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const oldLink = await link_1.Link.createWithNewConnections(src, dest);
    const connA = oldLink.endA.connectionID;
    await t.throwsAsync(() => link_1.Link.createWithExistingConnections(src, src, connA, connA));
});
ava_1.default.serial(`errors when reusing connections which don’t match`, async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const oldLink1 = await link_1.Link.createWithNewConnections(src, dest);
    const connA = oldLink1.endA.connectionID;
    const oldLink2 = await link_1.Link.createWithNewConnections(src, dest);
    const connB = oldLink2.endB.connectionID;
    await t.throwsAsync(() => link_1.Link.createWithExistingConnections(src, dest, connA, connB));
});
ava_1.default.serial("submit multiple tx, get unreceived packets", async (t) => {
    // setup a channel
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB);
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    // no packets here
    const noPackets = await link.endA.querySentPackets();
    t.is(noPackets.length, 0);
    // let's make 3 transfer tx at different heights
    const amounts = [1000, 2222, 3456];
    const txHeights = await (0, helpers_1.transferTokens)(nodeA, helpers_1.gaia.denomFee, nodeB, helpers_1.wasmd.prefix, channels.src, amounts);
    // ensure these are different
    t.assert(txHeights[1] > txHeights[0], txHeights.toString());
    t.assert(txHeights[2] > txHeights[1], txHeights.toString());
    // need to wait briefly for it to be indexed
    await nodeA.waitOneBlock();
    // now query for all packets
    const packets = await link.getPendingPackets("A");
    t.is(packets.length, 3);
    t.deepEqual(packets.map(({ height }) => height), txHeights);
    // ensure no acks yet
    const preAcks = await link.getPendingAcks("B");
    t.is(preAcks.length, 0);
    // let's pre-update to test conditional logic (no need to update below)
    await nodeA.waitOneBlock();
    await link.updateClient("A");
    // submit 2 of them (out of order)
    const submit = [packets[0], packets[2]];
    const txAcks = await link.relayPackets("A", submit);
    t.is(txAcks.length, 2);
    // need to wait briefly for it to be indexed
    await nodeA.waitOneBlock();
    // ensure only one marked pending (for tx1)
    const postPackets = await link.getPendingPackets("A");
    t.is(postPackets.length, 1);
    t.is(postPackets[0].height, txHeights[1]);
    // ensure acks can be queried
    const acks = await link.getPendingAcks("B");
    t.is(acks.length, 2);
    // submit one of the acks, without waiting (it must update client)
    await link.relayAcks("B", acks.slice(0, 1));
    // ensure only one ack is still pending
    const postAcks = await link.getPendingAcks("B");
    t.is(postAcks.length, 1);
    // and it matches the one we did not send
    t.deepEqual(postAcks[0], acks[1]);
});
ava_1.default.serial("submit multiple tx on multiple channels, get unreceived packets", async (t) => {
    const logger = new helpers_1.TestLogger();
    // setup a channel
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    const channels1 = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    const channels2 = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    t.not(channels1.src.channelId, channels2.src.channelId);
    // no packets here
    const noPackets = await link.endA.querySentPackets();
    t.is(noPackets.length, 0);
    // let's make 3 transfer tx at different heights on each channel pair
    const amounts = [1000, 2222, 3456];
    const tx1 = await (0, helpers_1.transferTokens)(nodeA, helpers_1.gaia.denomFee, nodeB, helpers_1.wasmd.prefix, channels1.src, amounts);
    const tx2 = await (0, helpers_1.transferTokens)(nodeA, helpers_1.gaia.denomFee, nodeB, helpers_1.wasmd.prefix, channels2.src, amounts);
    const txHeights = {
        channels1: tx1.map((height) => ({
            height,
            channelId: channels1.src.channelId,
        })),
        channels2: tx2.map((height) => ({
            height,
            channelId: channels2.src.channelId,
        })),
    };
    // need to wait briefly for it to be indexed
    await nodeA.waitForIndexer();
    // now query for all packets, ensuring we mapped the channels properly
    const packets = await link.getPendingPackets("A");
    t.is(packets.length, 6);
    t.deepEqual(packets.map(({ height, packet }) => ({
        height,
        channelId: packet.sourceChannel,
    })), [...txHeights.channels1, ...txHeights.channels2]);
    // ensure no acks yet
    const preAcks = await link.getPendingAcks("B");
    t.is(preAcks.length, 0);
    // submit 4 of them (out of order) - make sure not to use same sequences on both sides
    const packetsToSubmit = [packets[0], packets[1], packets[4], packets[5]];
    const txAcks = await link.relayPackets("A", packetsToSubmit);
    t.is(txAcks.length, 4);
    await nodeA.waitOneBlock();
    // ensure only two marked pending (for tx1)
    const postPackets = await link.getPendingPackets("A");
    t.is(postPackets.length, 2);
    t.is(postPackets[0].height, txHeights.channels1[2].height);
    t.is(postPackets[1].height, txHeights.channels2[0].height);
    // ensure acks can be queried
    const acks = await link.getPendingAcks("B");
    t.is(acks.length, 4);
    // make sure we ack on different channels (and different sequences)
    t.not(acks[0].originalPacket.sourceChannel, acks[3].originalPacket.sourceChannel);
    t.not(acks[0].originalPacket.sequence, acks[3].originalPacket.sequence);
    await link.relayAcks("B", [acks[0], acks[3]]);
    await nodeA.waitOneBlock();
    // ensure only two acks are still pending
    const postAcks = await link.getPendingAcks("B");
    t.is(postAcks.length, 2);
    // and it matches the ones we did not send
    t.deepEqual(postAcks[0], acks[1]);
    t.deepEqual(postAcks[1], acks[2]);
});
ava_1.default.serial("updateClientIfStale only runs if it is too long since an update", async (t) => {
    // setup
    const logger = new helpers_1.TestLogger();
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    // height before waiting
    const heightA = (await nodeA.latestHeader()).height;
    const heightB = (await nodeB.latestHeader()).height;
    // wait a few blocks so we can get stale ones
    for (let i = 0; i < 10; i++) {
        await Promise.all([nodeA.waitOneBlock(), nodeB.waitOneBlock()]);
    }
    // we definitely have updated within the last 1000 seconds, this should do nothing
    const noUpdateA = await link.updateClientIfStale("A", 1000);
    t.is(noUpdateA, null);
    const noUpdateB = await link.updateClientIfStale("B", 1000);
    t.is(noUpdateB, null);
    // we haven't updated in the last 2 seconds, this should trigger the update
    const updateA = await link.updateClientIfStale("A", 2);
    (0, utils_1.assert)(updateA);
    t.assert(Number(updateA.revisionHeight) > heightA);
    const updateB = await link.updateClientIfStale("B", 2);
    (0, utils_1.assert)(updateB);
    t.assert(Number(updateB.revisionHeight) > heightB);
});
ava_1.default.serial("checkAndRelayPacketsAndAcks relays packets properly", async (t) => {
    const logger = new helpers_1.TestLogger();
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    const checkPending = async (packA, packB, ackA, ackB) => {
        const packetsA = await link.getPendingPackets("A");
        t.is(packetsA.length, packA);
        const packetsB = await link.getPendingPackets("B");
        t.is(packetsB.length, packB);
        const acksA = await link.getPendingAcks("A");
        t.is(acksA.length, ackA);
        const acksB = await link.getPendingAcks("B");
        t.is(acksB.length, ackB);
    };
    // no packets here
    await checkPending(0, 0, 0, 0);
    // ensure no problems running relayer with no packets
    await link.checkAndRelayPacketsAndAcks({});
    // send 3 from A -> B
    const amountsA = [1000, 2222, 3456];
    const txHeightsA = await (0, helpers_1.transferTokens)(nodeA, helpers_1.gaia.denomFee, nodeB, helpers_1.wasmd.prefix, channels.src, amountsA, 5000);
    // send 2 from B -> A
    const amountsB = [76543, 12345];
    const txHeightsB = await (0, helpers_1.transferTokens)(nodeB, helpers_1.wasmd.denomFee, nodeA, helpers_1.gaia.prefix, channels.dest, amountsB, 5000);
    await nodeA.waitOneBlock();
    // ensure these packets are present in query
    await checkPending(3, 2, 0, 0);
    // let's one on each side (should filter only the last == minHeight)
    const relayFrom = {
        packetHeightA: txHeightsA[2],
        packetHeightB: txHeightsB[1],
    };
    // check the result here and ensure it is after the latest height
    const nextRelay = await link.checkAndRelayPacketsAndAcks(relayFrom);
    // next acket is more recent than the transactions
    (0, utils_1.assert)(nextRelay.packetHeightA);
    t.assert(nextRelay.packetHeightA > txHeightsA[2]);
    (0, utils_1.assert)(nextRelay.packetHeightB);
    // since we don't wait a block after this transfer, it may be the same
    t.assert(nextRelay.packetHeightB >= txHeightsB[1]);
    // next ack queries is more recent than the packet queries
    (0, utils_1.assert)(nextRelay.ackHeightA);
    t.assert(nextRelay.ackHeightA > nextRelay.packetHeightA);
    (0, utils_1.assert)(nextRelay.ackHeightB);
    t.assert(nextRelay.ackHeightB > nextRelay.packetHeightB);
    // ensure those packets were sent, and their acks as well
    await checkPending(2, 1, 0, 0);
    // if we send again with the return of this last relay, we don't get anything new
    await link.checkAndRelayPacketsAndAcks(nextRelay);
    await checkPending(2, 1, 0, 0);
    // sent the remaining packets (no minimum)
    await link.checkAndRelayPacketsAndAcks({});
    // ensure those packets were sent, and their acks as well
    await checkPending(0, 0, 0, 0);
});
ava_1.default.serial("timeout expired packets", async (t) => {
    const logger = new helpers_1.TestLogger();
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    // no packets here
    const noPackets = await link.endA.querySentPackets();
    t.is(noPackets.length, 0);
    // some basic setup for the transfers
    const recipient = (0, helpers_1.randomAddress)(helpers_1.wasmd.prefix);
    const timeoutDestHeight = await nodeB.timeoutHeight(2);
    const submitDestHeight = await nodeB.timeoutHeight(500);
    const amounts = [1000, 2222, 3456];
    const timeoutHeights = [
        submitDestHeight,
        timeoutDestHeight,
        submitDestHeight,
        // we need the timeout height of the *receiving* chain
    ];
    const timedOut = (0, utils_2.secondsFromDateNanos)(await nodeB.currentTime()) + 1;
    const plentyTime = timedOut + 3000;
    const timeoutTimes = [timedOut, plentyTime, plentyTime];
    // Note: 1st times out with time, 2nd with height, 3rd is valid
    // let's make 3 transfer tx at different heights
    const txHeights = [];
    for (let i = 0; i < amounts.length; ++i) {
        const token = { amount: amounts[i].toString(), denom: helpers_1.gaia.denomFee };
        const { height } = await nodeA.transferTokens(channels.src.portId, channels.src.channelId, token, recipient, timeoutHeights[i], timeoutTimes[i]);
        txHeights.push(height);
    }
    // ensure these are different
    t.assert(txHeights[1] > txHeights[0], txHeights.toString());
    t.assert(txHeights[2] > txHeights[1], txHeights.toString());
    // need to wait briefly for it to be indexed
    await nodeA.waitForIndexer();
    // now query for all packets
    const packets = await link.getPendingPackets("A");
    t.is(packets.length, 3);
    t.deepEqual(packets.map(({ height }) => height), txHeights);
    // ensure no acks yet
    const preAcks = await link.getPendingAcks("B");
    t.is(preAcks.length, 0);
    // wait to trigger timeout
    await nodeA.waitOneBlock();
    await nodeA.waitOneBlock();
    await nodeA.waitOneBlock();
    // get the new state on dest (and give a little lee-way - 2 blocks / 1 second)
    const currentHeight = await link.endB.client.timeoutHeight(2);
    const currentTime = (0, utils_2.secondsFromDateNanos)(await link.endB.client.currentTime()) + 1;
    const { toSubmit, toTimeout } = (0, utils_2.splitPendingPackets)(currentHeight, currentTime, packets);
    t.is(toSubmit.length, 1);
    t.is(toTimeout.length, 2);
    // submit the ones which didn't timeout
    const txAcks = await link.relayPackets("A", toSubmit);
    t.is(txAcks.length, 1);
    // one completed after relay
    const afterRelay = await link.getPendingPackets("A");
    t.is(afterRelay.length, 2);
    // try to submit the one which did timeout
    await t.throwsAsync(() => link.relayPackets("A", toTimeout));
    // timeout remaining packet
    await link.timeoutPackets("A", toTimeout);
    // nothing left after timeout
    const afterTimeout = await link.getPendingPackets("A");
    t.is(afterTimeout.length, 0);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9saW5rLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5Q0FBdUM7QUFDdkMsOENBQXVCO0FBQ3ZCLHNFQUFpRTtBQUVqRSx1Q0FRbUI7QUFDbkIsMkNBQXNEO0FBQ3RELGlDQUE4QztBQUM5QyxtQ0FBb0U7QUFFcEUsYUFBSSxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVSxFQUFFLENBQUM7SUFDaEMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLElBQUEsZUFBSyxFQUFDLGNBQUksRUFBRSxlQUFLLENBQUMsQ0FBQztJQUU3QyxNQUFNLElBQUksR0FBRyxNQUFNLFdBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3BFLDRDQUE0QztJQUM1QyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlFLGlFQUFpRTtJQUNqRSxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsNkJBQTZCO0lBQzdCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3Qiw2QkFBNkI7SUFFN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMs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