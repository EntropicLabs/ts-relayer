"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const tx_1 = require("cosmjs-types/ibc/applications/transfer/v1/tx");
const helpers_1 = require("./helpers");
const ibcclient_1 = require("./ibcclient");
const link_1 = require("./link");
const utils_1 = require("./utils");
ava_1.default.serial("create gaia client on wasmd", async (t) => {
    const logger = new helpers_1.TestLogger();
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const preClients = await dest.query.ibc.client.allStates();
    const preLen = preClients.clientStates.length;
    const header = await src.latestHeader();
    const conState = (0, utils_1.buildConsensusState)(header);
    const cliState = (0, utils_1.buildClientState)(await src.getChainId(), 1000, 500, src.revisionHeight(header.height));
    const res = await dest.createTendermintClient(cliState, conState);
    t.assert(res.clientId.startsWith("07-tendermint-"));
    await dest.waitOneBlock();
    const postClients = await dest.query.ibc.client.allStates();
    t.is(postClients.clientStates.length, preLen + 1);
});
ava_1.default.serial("create and update wasmd client on gaia", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const header = await src.latestHeader();
    const conState = (0, utils_1.buildConsensusState)(header);
    const cliState = (0, utils_1.buildClientState)(await src.getChainId(), 1000, 500, src.revisionHeight(header.height));
    const { clientId } = await dest.createTendermintClient(cliState, conState);
    const state = await dest.query.ibc.client.stateTm(clientId);
    // console.error(state);
    // TODO: check more details?
    t.is(Number(state.latestHeight?.revisionHeight), header.height);
    t.deepEqual(state.chainId, await src.getChainId());
    // wait for a few blocks, then try
    for (let i = 0; i < 10; i++) {
        await src.waitOneBlock();
    }
    const newHeader = await src.buildHeader(header.height);
    const newHeight = newHeader.signedHeader?.header?.height;
    t.not(Number(newHeight), header.height);
    await dest.updateTendermintClient(clientId, newHeader);
    // any other checks?
    const upstate = await dest.query.ibc.client.stateTm(clientId);
    t.assert(sameBigInt(upstate.latestHeight?.revisionHeight, newHeight));
});
// handles both as optional fields, does Long.equal to ignore signed/unsigned difference
function sameBigInt(a, b) {
    if (a === undefined) {
        return false;
    }
    if (b === undefined) {
        return false;
    }
    return a == b;
}
// make 2 clients, and try to establish a connection
ava_1.default.serial("perform connection handshake", async (t) => {
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    // client on dest -> src
    const args = await (0, ibcclient_1.buildCreateClientArgs)(src, 5000);
    const { clientId: destClientId } = await dest.createTendermintClient(args.clientState, args.consensusState);
    t.assert(destClientId.startsWith("07-tendermint-"));
    // client on src -> dest
    const args2 = await (0, ibcclient_1.buildCreateClientArgs)(dest, 5000);
    const { clientId: srcClientId } = await src.createTendermintClient(args2.clientState, args2.consensusState);
    t.assert(srcClientId.startsWith("07-tendermint-"));
    // connectionInit on src
    const { connectionId: srcConnId } = await src.connOpenInit(srcClientId, destClientId);
    t.assert(srcConnId.startsWith("connection-"), srcConnId);
    // connectionTry on dest
    const proof = await (0, ibcclient_1.prepareConnectionHandshake)(src, dest, srcClientId, destClientId, srcConnId);
    // now post and hope it is accepted
    const { connectionId: destConnId } = await dest.connOpenTry(destClientId, proof);
    t.assert(destConnId.startsWith("connection-"), destConnId);
    // connectionAck on src
    const proofAck = await (0, ibcclient_1.prepareConnectionHandshake)(dest, src, destClientId, srcClientId, destConnId);
    await src.connOpenAck(srcConnId, proofAck);
    // connectionConfirm on dest
    const proofConfirm = await (0, ibcclient_1.prepareConnectionHandshake)(src, dest, srcClientId, destClientId, srcConnId);
    await dest.connOpenConfirm(destConnId, proofConfirm);
});
ava_1.default.serial("transfer message and send packets", async (t) => {
    const logger = new helpers_1.TestLogger();
    // set up ics20 channel
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    t.is(channels.src.portId, helpers_1.gaia.ics20Port);
    // make an account on remote chain, and check it is empty
    const recipient = (0, helpers_1.randomAddress)(helpers_1.wasmd.prefix);
    const preBalance = await nodeB.query.bank.allBalances(recipient);
    t.is(preBalance.length, 0);
    // submit a transfer message
    const destHeight = await nodeB.timeoutHeight(500); // valid for 500 blocks
    const token = { amount: "12345", denom: helpers_1.gaia.denomFee };
    const transferResult = await nodeA.transferTokens(channels.src.portId, channels.src.channelId, token, recipient, destHeight);
    const packets = (0, utils_1.parsePacketsFromEvents)(transferResult.events);
    t.is(packets.length, 1);
    const packet = packets[0];
    // base the proof sequence on prepareChannelHandshake
    // update client on dest
    await nodeA.waitOneBlock();
    const headerHeight = await nodeB.doUpdateClient(link.endB.clientID, nodeA);
    const proof = await nodeA.getPacketProof(packet, headerHeight);
    const relayResult = await nodeB.receivePacket(packet, proof, headerHeight);
    // query balance of recipient (should be "12345" or some odd hash...)
    const postBalance = await nodeB.query.bank.allBalances(recipient);
    t.is(postBalance.length, 1);
    const recvCoin = postBalance[0];
    t.is(recvCoin.amount, "12345");
    t.assert(recvCoin.denom.startsWith("ibc/"), recvCoin.denom);
    // get the acknowledgement from the receivePacket tx
    const acks = (0, utils_1.parseAcksFromTxEvents)(relayResult.events);
    t.is(acks.length, 1);
    const ack = acks[0];
    // get an ack proof and return to node A
    await nodeB.waitOneBlock();
    const ackHeaderHeight = await nodeA.doUpdateClient(link.endA.clientID, nodeB);
    const ackProof = await nodeB.getAckProof(ack, ackHeaderHeight);
    await nodeA.acknowledgePacket(ack, ackProof, ackHeaderHeight);
    // Do we need to check the result? or just see the tx succeeded?
});
ava_1.default.serial("tests parsing with multi-message", async (t) => {
    const logger = new helpers_1.TestLogger();
    // set up ics20 channel
    const [nodeA, nodeB] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger);
    const channels = await link.createChannel("A", helpers_1.gaia.ics20Port, helpers_1.wasmd.ics20Port, helpers_1.ics20.ordering, helpers_1.ics20.version);
    // make an account on remote chain for testing
    const destAddr = (0, helpers_1.randomAddress)(helpers_1.wasmd.prefix);
    const srcAddr = (0, helpers_1.randomAddress)(helpers_1.gaia.prefix);
    // submit a send message - no events
    const { events: sendEvents } = await nodeA.sendTokens(srcAddr, [
        { amount: "5000", denom: helpers_1.gaia.denomFee },
    ]);
    t.assert(logger.verbose.calledWithMatch(/Send tokens to/), logger.verbose.callCount.toString());
    t.assert(logger.debug.calledWithMatch(/Send tokens:/), logger.debug.callCount.toString());
    const sendPackets = (0, utils_1.parsePacketsFromEvents)(sendEvents);
    t.is(sendPackets.length, 0);
    const sendAcks = (0, utils_1.parseAcksFromTxEvents)(sendEvents);
    t.is(sendAcks.length, 0);
    // submit 2 transfer messages
    const timeoutHeight = await nodeB.timeoutHeight(500);
    const msg = {
        typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
        value: tx_1.MsgTransfer.fromPartial({
            sourcePort: channels.src.portId,
            sourceChannel: channels.src.channelId,
            sender: nodeA.senderAddress,
            token: { amount: "6000", denom: helpers_1.gaia.denomFee },
            receiver: destAddr,
            timeoutHeight,
        }),
    };
    const msg2 = {
        typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
        value: tx_1.MsgTransfer.fromPartial({
            sourcePort: channels.src.portId,
            sourceChannel: channels.src.channelId,
            sender: nodeA.senderAddress,
            token: { amount: "9000", denom: helpers_1.gaia.denomFee },
            receiver: destAddr,
            timeoutHeight,
        }),
    };
    const { events: multiEvents } = await nodeA.sendMultiMsg([msg, msg2]);
    const multiPackets = (0, utils_1.parsePacketsFromEvents)(multiEvents);
    t.is(multiPackets.length, 2);
    // no acks here
    const multiAcks = (0, utils_1.parseAcksFromTxEvents)(multiEvents);
    t.is(multiAcks.length, 0);
    // post them to the other side
    await nodeA.waitOneBlock();
    const headerHeight = await nodeB.doUpdateClient(link.endB.clientID, nodeA);
    const proofs = await Promise.all(multiPackets.map((packet) => nodeA.getPacketProof(packet, headerHeight)));
    const { events: relayEvents } = await nodeB.receivePackets(multiPackets, proofs, headerHeight);
    // no recv packets here
    const relayPackets = (0, utils_1.parsePacketsFromEvents)(relayEvents);
    t.is(relayPackets.length, 0);
    // but we got 2 acks
    const relayAcks = (0, utils_1.parseAcksFromTxEvents)(relayEvents);
    t.is(relayAcks.length, 2);
    // relay them together
    await nodeB.waitOneBlock();
    const ackHeaderHeight = await nodeA.doUpdateClient(link.endA.clientID, nodeB);
    const ackProofs = await Promise.all(relayAcks.map((ack) => nodeB.getAckProof(ack, ackHeaderHeight)));
    await nodeA.acknowledgePackets(relayAcks, ackProofs, ackHeaderHeight);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWJjY2xpZW50LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2liY2NsaWVudC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsOENBQXVCO0FBQ3ZCLHFFQUEyRTtBQUUzRSx1Q0FPbUI7QUFDbkIsMkNBQWdGO0FBQ2hGLGlDQUE4QjtBQUM5QixtQ0FLaUI7QUFFakIsYUFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDckQsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVSxFQUFFLENBQUM7SUFDaEMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLElBQUEsZUFBSyxFQUFDLGNBQUksRUFBRSxlQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFckQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDM0QsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7SUFFOUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7SUFFeEMsTUFBTSxRQUFRLEdBQUcsSUFBQSwyQkFBbUIsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFBLHdCQUFnQixFQUMvQixNQUFNLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFDdEIsSUFBSSxFQUNKLEdBQUcsRUFDSCxHQUFHLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FDbEMsQ0FBQztJQUNGLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENB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