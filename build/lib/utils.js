"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentPacketData = exports.splitPendingPackets = exports.timeGreater = exports.heightGreater = exports.parseAck = exports.parseAcksFromTxEvents = exports.parsePacket = exports.parseHeightAttribute = exports.parsePacketsFromTendermintEvents = exports.parsePacketsFromEvents = exports.parsePacketsFromBlockResult = exports.buildClientState = exports.buildConsensusState = exports.secondsFromDateNanos = exports.timestampFromDateNanos = exports.mapRpcPubKeyToProto = exports.may = exports.parseRevisionNumber = exports.subtractBlock = exports.ensureIntHeight = exports.toIntHeight = exports.createDeliverTxFailureMessage = void 0;
const encoding_1 = require("@cosmjs/encoding");
const stargate_1 = require("@cosmjs/stargate");
const proofs_1 = require("cosmjs-types/cosmos/ics23/v1/proofs");
const timestamp_1 = require("cosmjs-types/google/protobuf/timestamp");
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const tendermint_1 = require("cosmjs-types/ibc/lightclients/tendermint/v1/tendermint");
function createDeliverTxFailureMessage(result) {
    return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}
exports.createDeliverTxFailureMessage = createDeliverTxFailureMessage;
function toIntHeight(height) {
    return Number(height?.revisionHeight) ?? 0;
}
exports.toIntHeight = toIntHeight;
function ensureIntHeight(height) {
    if (typeof height === "bigint") {
        return Number(height);
    }
    return toIntHeight(height);
}
exports.ensureIntHeight = ensureIntHeight;
function subtractBlock(height, count = 1n) {
    return {
        revisionNumber: height.revisionNumber,
        revisionHeight: height.revisionHeight - count,
    };
}
exports.subtractBlock = subtractBlock;
const regexRevNum = new RegExp("-([1-9][0-9]*)$");
function parseRevisionNumber(chainId) {
    const match = chainId.match(regexRevNum);
    if (match && match.length >= 2) {
        return BigInt(match[1]);
    }
    return 0n;
}
exports.parseRevisionNumber = parseRevisionNumber;
// may will run the transform if value is defined, otherwise returns undefined
function may(transform, value) {
    return value === undefined || value === null ? undefined : transform(value);
}
exports.may = may;
function mapRpcPubKeyToProto(pubkey) {
    if (pubkey === undefined) {
        return undefined;
    }
    if (pubkey.algorithm == "ed25519") {
        return {
            ed25519: pubkey.data,
            secp256k1: undefined,
        };
    }
    else if (pubkey.algorithm == "secp256k1") {
        return {
            ed25519: undefined,
            secp256k1: pubkey.data,
        };
    }
    else {
        throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Unknown validator pubkey type: ${pubkey.algorithm}`);
    }
}
exports.mapRpcPubKeyToProto = mapRpcPubKeyToProto;
function timestampFromDateNanos(date) {
    const nanos = (date.getTime() % 1000) * 1000000 + (date.nanoseconds ?? 0);
    return timestamp_1.Timestamp.fromPartial({
        seconds: BigInt(Math.floor(date.getTime() / 1000)),
        nanos,
    });
}
exports.timestampFromDateNanos = timestampFromDateNanos;
function secondsFromDateNanos(date) {
    return Math.floor(date.getTime() / 1000);
}
exports.secondsFromDateNanos = secondsFromDateNanos;
function buildConsensusState(header) {
    return tendermint_1.ConsensusState.fromPartial({
        timestamp: timestampFromDateNanos(header.time),
        root: {
            hash: header.appHash,
        },
        nextValidatorsHash: header.nextValidatorsHash,
    });
}
exports.buildConsensusState = buildConsensusState;
// Note: we hardcode a number of assumptions, like trust level, clock drift, and assume revisionNumber is 1
function buildClientState(chainId, unbondingPeriodSec, trustPeriodSec, height) {
    // Copied here until https://github.com/confio/ics23/issues/36 is resolved
    // https://github.com/confio/ics23/blob/master/js/src/proofs.ts#L11-L26
    const iavlSpec = {
        leafSpec: {
            prefix: Uint8Array.from([0]),
            hash: proofs_1.HashOp.SHA256,
            prehashValue: proofs_1.HashOp.SHA256,
            prehashKey: proofs_1.HashOp.NO_HASH,
            length: proofs_1.LengthOp.VAR_PROTO,
        },
        innerSpec: {
            childOrder: [0, 1],
            minPrefixLength: 4,
            maxPrefixLength: 12,
            childSize: 33,
            hash: proofs_1.HashOp.SHA256,
        },
    };
    const tendermintSpec = {
        leafSpec: {
            prefix: Uint8Array.from([0]),
            hash: proofs_1.HashOp.SHA256,
            prehashValue: proofs_1.HashOp.SHA256,
            prehashKey: proofs_1.HashOp.NO_HASH,
            length: proofs_1.LengthOp.VAR_PROTO,
        },
        innerSpec: {
            childOrder: [0, 1],
            minPrefixLength: 1,
            maxPrefixLength: 1,
            childSize: 32,
            hash: proofs_1.HashOp.SHA256,
        },
    };
    return tendermint_1.ClientState.fromPartial({
        chainId,
        trustLevel: {
            numerator: 1n,
            denominator: 3n,
        },
        unbondingPeriod: {
            seconds: BigInt(unbondingPeriodSec),
        },
        trustingPeriod: {
            seconds: BigInt(trustPeriodSec),
        },
        maxClockDrift: {
            seconds: 20n,
        },
        latestHeight: height,
        proofSpecs: [iavlSpec, tendermintSpec],
        upgradePath: ["upgrade", "upgradedIBCState"],
        allowUpdateAfterExpiry: false,
        allowUpdateAfterMisbehaviour: false,
    });
}
exports.buildClientState = buildClientState;
function parsePacketsFromBlockResult(result) {
    return parsePacketsFromTendermintEvents([
        ...result.beginBlockEvents,
        ...result.endBlockEvents,
    ]);
}
exports.parsePacketsFromBlockResult = parsePacketsFromBlockResult;
/** Those events are normalized to strings already in CosmJS */
function parsePacketsFromEvents(events) {
    return events.filter(({ type }) => type === "send_packet").map(parsePacket);
}
exports.parsePacketsFromEvents = parsePacketsFromEvents;
/**
 * Takes a list of events, finds the send_packet events, stringifies attributes
 * and parsed the events into `Packet`s.
 */
function parsePacketsFromTendermintEvents(events) {
    return parsePacketsFromEvents(events.map(stargate_1.fromTendermintEvent));
}
exports.parsePacketsFromTendermintEvents = parsePacketsFromTendermintEvents;
function parseHeightAttribute(attribute) {
    // Note: With cosmjs-types>=0.9.0, I believe this no longer needs to return undefined under any circumstances
    // but will need more extensive testing before refactoring.
    const [timeoutRevisionNumber, timeoutRevisionHeight] = attribute?.split("-") ?? [];
    if (!timeoutRevisionHeight || !timeoutRevisionNumber) {
        return undefined;
    }
    const revisionNumber = BigInt(isNaN(Number(timeoutRevisionNumber)) ? 0 : timeoutRevisionNumber);
    const revisionHeight = BigInt(isNaN(Number(timeoutRevisionHeight)) ? 0 : timeoutRevisionHeight);
    // note: 0 revisionNumber is allowed. If there is bad data, '' or '0-0', we will get 0 for the height
    if (revisionHeight == 0n) {
        return undefined;
    }
    return { revisionHeight, revisionNumber };
}
exports.parseHeightAttribute = parseHeightAttribute;
function parsePacket({ type, attributes }) {
    if (type !== "send_packet") {
        throw new Error(`Cannot parse event of type ${type}`);
    }
    const attributesObj = attributes.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value,
    }), {});
    return channel_1.Packet.fromPartial({
        sequence: may(BigInt, attributesObj.packet_sequence),
        /** identifies the port on the sending chain. */
        sourcePort: attributesObj.packet_src_port,
        /** identifies the channel end on the sending chain. */
        sourceChannel: attributesObj.packet_src_channel,
        /** identifies the port on the receiving chain. */
        destinationPort: attributesObj.packet_dst_port,
        /** identifies the channel end on the receiving chain. */
        destinationChannel: attributesObj.packet_dst_channel,
        /** actual opaque bytes transferred directly to the application module */
        data: attributesObj.packet_data
            ? (0, encoding_1.toUtf8)(attributesObj.packet_data)
            : undefined,
        /** block height after which the packet times out */
        timeoutHeight: parseHeightAttribute(attributesObj.packet_timeout_height),
        /** block timestamp (in nanoseconds) after which the packet times out */
        timeoutTimestamp: may(BigInt, attributesObj.packet_timeout_timestamp),
    });
}
exports.parsePacket = parsePacket;
function parseAcksFromTxEvents(events) {
    return events
        .filter(({ type }) => type === "write_acknowledgement")
        .map(parseAck);
}
exports.parseAcksFromTxEvents = parseAcksFromTxEvents;
function parseAck({ type, attributes }) {
    if (type !== "write_acknowledgement") {
        throw new Error(`Cannot parse event of type ${type}`);
    }
    const attributesObj = attributes.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value,
    }), {});
    const originalPacket = channel_1.Packet.fromPartial({
        sequence: may(BigInt, attributesObj.packet_sequence),
        /** identifies the port on the sending chain. */
        sourcePort: attributesObj.packet_src_port,
        /** identifies the channel end on the sending chain. */
        sourceChannel: attributesObj.packet_src_channel,
        /** identifies the port on the receiving chain. */
        destinationPort: attributesObj.packet_dst_port,
        /** identifies the channel end on the receiving chain. */
        destinationChannel: attributesObj.packet_dst_channel,
        /** actual opaque bytes transferred directly to the application module */
        data: (0, encoding_1.toUtf8)(attributesObj.packet_data ?? ""),
        /** block height after which the packet times out */
        timeoutHeight: parseHeightAttribute(attributesObj.packet_timeout_height),
        /** block timestamp (in nanoseconds) after which the packet times out */
        timeoutTimestamp: may(BigInt, attributesObj.packet_timeout_timestamp),
    });
    const acknowledgement = (0, encoding_1.toUtf8)(attributesObj.packet_ack ?? "");
    return {
        acknowledgement,
        originalPacket,
    };
}
exports.parseAck = parseAck;
// return true if a > b, or a undefined
function heightGreater(a, b) {
    if (a === undefined ||
        (a.revisionHeight === BigInt(0) && a.revisionNumber === BigInt(0))) {
        return true;
    }
    // comparing longs made some weird issues (maybe signed/unsigned)?
    // convert to numbers to compare safely
    const [numA, heightA, numB, heightB] = [
        Number(a.revisionNumber),
        Number(a.revisionHeight),
        Number(b.revisionNumber),
        Number(b.revisionHeight),
    ];
    const valid = numA > numB || (numA == numB && heightA > heightB);
    return valid;
}
exports.heightGreater = heightGreater;
// return true if a > b, or a 0
// note a is nanoseconds, while b is seconds
function timeGreater(a, b) {
    if (a === undefined || a == 0n) {
        return true;
    }
    const valid = Number(a) > b * 1000000000;
    return valid;
}
exports.timeGreater = timeGreater;
// take height and time from receiving chain to see which packets have timed out
// return [toSubmit, toTimeout].
// you can advance height, time a block or two into the future if you wish a margin of error
function splitPendingPackets(currentHeight, currentTime, // in seconds
packets) {
    return packets.reduce((acc, packet) => {
        const validPacket = heightGreater(packet.packet.timeoutHeight, currentHeight) &&
            timeGreater(packet.packet.timeoutTimestamp, currentTime);
        return validPacket
            ? {
                ...acc,
                toSubmit: [...acc.toSubmit, packet],
            }
            : {
                ...acc,
                toTimeout: [...acc.toTimeout, packet],
            };
    }, {
        toSubmit: [],
        toTimeout: [],
    });
}
exports.splitPendingPackets = splitPendingPackets;
function presentPacketData(data) {
    try {
        return JSON.parse((0, encoding_1.fromUtf8)(data));
    }
    catch {
        return { hex: (0, encoding_1.toHex)(data) };
    }
}
exports.presentPacketData = presentPacketData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtDQUEyRDtBQUMzRCwrQ0FJMEI7QUFPMUIsZ0VBQXVFO0FBQ3ZFLHNFQUFtRTtBQUNuRSxzRUFBa0U7QUFFbEUsdUZBR2dFO0FBVWhFLFNBQWdCLDZCQUE2QixDQUMzQyxNQUF5QjtJQUV6QixPQUFPLDhCQUE4QixNQUFNLENBQUMsZUFBZSxjQUFjLE1BQU0sQ0FBQyxNQUFNLFdBQVcsTUFBTSxDQUFDLElBQUksY0FBYyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDNUksQ0FBQztBQUpELHNFQUlDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWU7SUFDekMsT0FBTyxNQUFNLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QyxDQUFDO0FBRkQsa0NBRUM7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBdUI7SUFDckQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7UUFDOUIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBTEQsMENBS0M7QUFFRCxTQUFnQixhQUFhLENBQUMsTUFBYyxFQUFFLEtBQUssR0FBRyxFQUFFO0lBQ3RELE9BQU87UUFDTCxjQUFjLEVBQUUsTUFBTSxDQUFDLGNBQWM7UUFDckMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxjQUFjLEdBQUcsS0FBSztLQUM5QyxDQUFDO0FBQ0osQ0FBQztBQUxELHNDQUtDO0FBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUVsRCxTQUFnQixtQkFBbUIsQ0FBQyxPQUFlO0lBQ2pELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFD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