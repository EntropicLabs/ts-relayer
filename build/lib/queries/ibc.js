"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIbcExtension = exports.heightQueryString = void 0;
const encoding_1 = require("@cosmjs/encoding");
const math_1 = require("@cosmjs/math");
const stargate_1 = require("@cosmjs/stargate");
const proofs_1 = require("cosmjs-types/cosmos/ics23/v1/proofs");
const any_1 = require("cosmjs-types/google/protobuf/any");
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const query_1 = require("cosmjs-types/ibc/core/channel/v1/query");
const query_2 = require("cosmjs-types/ibc/core/client/v1/query");
const commitment_1 = require("cosmjs-types/ibc/core/commitment/v1/commitment");
const connection_1 = require("cosmjs-types/ibc/core/connection/v1/connection");
const query_3 = require("cosmjs-types/ibc/core/connection/v1/query");
const tendermint_1 = require("cosmjs-types/ibc/lightclients/tendermint/v1/tendermint");
function decodeTendermintClientStateAny(clientState) {
    if (clientState?.typeUrl !== "/ibc.lightclients.tendermint.v1.ClientState") {
        throw new Error(`Unexpected client state type: ${clientState?.typeUrl}`);
    }
    return tendermint_1.ClientState.decode(clientState.value);
}
function decodeTendermintConsensusStateAny(clientState) {
    if (clientState?.typeUrl !== "/ibc.lightclients.tendermint.v1.ConsensusState") {
        throw new Error(`Unexpected client state type: ${clientState?.typeUrl}`);
    }
    return tendermint_1.ConsensusState.decode(clientState.value);
}
function heightQueryString(height) {
    return `${height.revisionNumber}-${height.revisionHeight}`;
}
exports.heightQueryString = heightQueryString;
function setupIbcExtension(base) {
    const rpc = (0, stargate_1.createProtobufRpcClient)(base);
    // Use these services to get easy typed access to query methods
    // These cannot be used for proof verification
    const channelQueryService = new query_1.QueryClientImpl(rpc);
    const clientQueryService = new query_2.QueryClientImpl(rpc);
    const connectionQueryService = new query_3.QueryClientImpl(rpc);
    return {
        ibc: {
            channel: {
                channel: async (portId, channelId) => channelQueryService.Channel({
                    portId,
                    channelId,
                }),
                channels: async (paginationKey) => channelQueryService.Channels({
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allChannels: async () => {
                    const channels = [];
                    let response;
                    let key;
                    do {
                        response = await channelQueryService.Channels({
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        channels.push(...response.channels);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        channels,
                        height: response.height,
                    };
                },
                connectionChannels: async (connection, paginationKey) => channelQueryService.ConnectionChannels({
                    connection,
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allConnectionChannels: async (connection) => {
                    const channels = [];
                    let response;
                    let key;
                    do {
                        response = await channelQueryService.ConnectionChannels({
                            connection,
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        channels.push(...response.channels);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        channels,
                        height: response.height,
                    };
                },
                clientState: async (portId, channelId) => channelQueryService.ChannelClientState({
                    portId,
                    channelId,
                }),
                consensusState: async (portId, channelId, revisionNumber, revisionHeight) => channelQueryService.ChannelConsensusState({
                    portId,
                    channelId,
                    revisionNumber: BigInt(revisionNumber),
                    revisionHeight: BigInt(revisionHeight),
                }),
                packetCommitment: async (portId, channelId, sequence) => channelQueryService.PacketCommitment({
                    portId,
                    channelId,
                    sequence,
                }),
                packetCommitments: async (portId, channelId, paginationKey) => channelQueryService.PacketCommitments({
                    channelId,
                    portId,
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allPacketCommitments: async (portId, channelId) => {
                    const commitments = [];
                    let response;
                    let key;
                    do {
                        response = await channelQueryService.PacketCommitments({
                            channelId,
                            portId,
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        commitments.push(...response.commitments);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        commitments,
                        height: response.height,
                    };
                },
                packetReceipt: async (portId, channelId, sequence) => channelQueryService.PacketReceipt({
                    portId,
                    channelId,
                    sequence: BigInt(sequence),
                }),
                packetAcknowledgement: async (portId, channelId, sequence) => channelQueryService.PacketAcknowledgement({
                    portId,
                    channelId,
                    sequence: BigInt(sequence),
                }),
                packetAcknowledgements: async (portId, channelId, paginationKey) => {
                    const request = query_1.QueryPacketAcknowledgementsRequest.fromPartial({
                        portId,
                        channelId,
                        pagination: (0, stargate_1.createPagination)(paginationKey),
                    });
                    return channelQueryService.PacketAcknowledgements(request);
                },
                allPacketAcknowledgements: async (portId, channelId) => {
                    const acknowledgements = [];
                    let response;
                    let key;
                    do {
                        const request = query_1.QueryPacketAcknowledgementsRequest.fromPartial({
                            channelId,
                            portId,
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        response =
                            await channelQueryService.PacketAcknowledgements(request);
                        acknowledgements.push(...response.acknowledgements);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        acknowledgements,
                        height: response.height,
                    };
                },
                unreceivedPackets: async (portId, channelId, packetCommitmentSequences) => channelQueryService.UnreceivedPackets({
                    portId,
                    channelId,
                    packetCommitmentSequences: packetCommitmentSequences.map((s) => BigInt(s)),
                }),
                unreceivedAcks: async (portId, channelId, packetAckSequences) => channelQueryService.UnreceivedAcks({
                    portId,
                    channelId,
                    packetAckSequences: packetAckSequences.map((s) => BigInt(s)),
                }),
                nextSequenceReceive: async (portId, channelId) => channelQueryService.NextSequenceReceive({
                    portId,
                    channelId,
                }),
            },
            client: {
                state: (clientId) => clientQueryService.ClientState({ clientId }),
                states: (paginationKey) => clientQueryService.ClientStates({
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allStates: async () => {
                    const clientStates = [];
                    let response;
                    let key;
                    do {
                        response = await clientQueryService.ClientStates({
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        clientStates.push(...response.clientStates);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        clientStates,
                    };
                },
                consensusState: (clientId, consensusHeight) => clientQueryService.ConsensusState(query_2.QueryConsensusStateRequest.fromPartial({
                    clientId,
                    revisionHeight: consensusHeight !== undefined
                        ? BigInt(consensusHeight)
                        : undefined,
                    latestHeight: consensusHeight === undefined,
                })),
                consensusStates: (clientId, paginationKey) => clientQueryService.ConsensusStates({
                    clientId,
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allConsensusStates: async (clientId) => {
                    const consensusStates = [];
                    let response;
                    let key;
                    do {
                        response = await clientQueryService.ConsensusStates({
                            clientId,
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        consensusStates.push(...response.consensusStates);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        consensusStates,
                    };
                },
                params: () => clientQueryService.ClientParams({}),
                stateTm: async (clientId) => {
                    const response = await clientQueryService.ClientState({ clientId });
                    return decodeTendermintClientStateAny(response.clientState);
                },
                statesTm: async (paginationKey) => {
                    const { clientStates } = await clientQueryService.ClientStates({
                        pagination: (0, stargate_1.createPagination)(paginationKey),
                    });
                    return clientStates.map(({ clientState }) => decodeTendermintClientStateAny(clientState));
                },
                allStatesTm: async () => {
                    const clientStates = [];
                    let response;
                    let key;
                    do {
                        response = await clientQueryService.ClientStates({
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        clientStates.push(...response.clientStates);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return clientStates.map(({ clientState }) => decodeTendermintClientStateAny(clientState));
                },
                consensusStateTm: async (clientId, consensusHeight) => {
                    const response = await clientQueryService.ConsensusState(query_2.QueryConsensusStateRequest.fromPartial({
                        clientId,
                        revisionHeight: consensusHeight?.revisionHeight,
                        revisionNumber: consensusHeight?.revisionNumber,
                        latestHeight: consensusHeight === undefined,
                    }));
                    return decodeTendermintConsensusStateAny(response.consensusState);
                },
            },
            connection: {
                connection: async (connectionId) => connectionQueryService.Connection({
                    connectionId,
                }),
                connections: async (paginationKey) => connectionQueryService.Connections({
                    pagination: (0, stargate_1.createPagination)(paginationKey),
                }),
                allConnections: async () => {
                    const connections = [];
                    let response;
                    let key;
                    do {
                        response = await connectionQueryService.Connections({
                            pagination: (0, stargate_1.createPagination)(key),
                        });
                        connections.push(...response.connections);
                        key = response.pagination?.nextKey;
                    } while (key && key.length);
                    return {
                        connections,
                        height: response.height,
                    };
                },
                clientConnections: async (clientId) => connectionQueryService.ClientConnections({
                    clientId,
                }),
                clientState: async (connectionId) => connectionQueryService.ConnectionClientState({
                    connectionId,
                }),
                consensusState: async (connectionId, revisionHeight) => connectionQueryService.ConnectionConsensusState(query_3.QueryConnectionConsensusStateRequest.fromPartial({
                    connectionId,
                    revisionHeight: BigInt(revisionHeight),
                })),
            },
            proof: {
                // these keys can all be found here: https://github.com/cosmos/cosmos-sdk/blob/v0.41.1/x/ibc/core/24-host/keys.go
                // note some have changed since the v0.40 pre-release this code was based on
                channel: {
                    channel: async (portId, channelId, proofHeight) => {
                        // key: https://github.com/cosmos/cosmos-sdk/blob/ef0a7344af345882729598bc2958a21143930a6b/x/ibc/24-host/keys.go#L117-L120
                        const key = (0, encoding_1.toAscii)(`channelEnds/ports/${portId}/channels/${channelId}`);
                        const proven = await base.queryRawProof("ibc", key, Number(proofHeight.revisionHeight));
                        const channel = channel_1.Channel.decode(proven.value);
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            channel,
                            proof,
                            proofHeight,
                        };
                    },
                    // designed only for timeout, modify if we need actual value not just proof
                    // could not verify absence of key receipts/ports/transfer/channels/channel-5/sequences/2
                    receiptProof: async (portId, channelId, sequence, proofHeight) => {
                        const key = (0, encoding_1.toAscii)(`receipts/ports/${portId}/channels/${channelId}/sequences/${sequence}`);
                        const proven = await base.queryRawProof("ibc", key, Number(proofHeight.revisionHeight));
                        const proof = convertProofsToIcs23(proven.proof);
                        return proof;
                    },
                    packetCommitment: async (portId, channelId, sequence, proofHeight) => {
                        const key = (0, encoding_1.toAscii)(`commitments/ports/${portId}/channels/${channelId}/sequences/${sequence}`);
                        const proven = await base.queryRawProof("ibc", key, Number(proofHeight.revisionHeight));
                        const commitment = proven.value;
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            commitment,
                            proof,
                            proofHeight,
                        };
                    },
                    packetAcknowledgement: async (portId, channelId, sequence, proofHeight) => {
                        const key = (0, encoding_1.toAscii)(`acks/ports/${portId}/channels/${channelId}/sequences/${sequence}`);
                        const proven = await base.queryRawProof("ibc", key, Number(proofHeight.revisionHeight));
                        const acknowledgement = proven.value;
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            acknowledgement,
                            proof,
                            proofHeight,
                        };
                    },
                    nextSequenceReceive: async (portId, channelId, proofHeight) => {
                        const key = (0, encoding_1.toAscii)(`nextSequenceRecv/ports/${portId}/channels/${channelId}`);
                        const proven = await base.queryRawProof("ibc", key, Number(proofHeight.revisionHeight));
                        const nextSequenceReceive = math_1.Uint64.fromBytes([...proven.value], "be").toBigInt();
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            nextSequenceReceive,
                            proof,
                            proofHeight,
                        };
                    },
                },
                client: {
                    state: async (clientId, proofHeight) => {
                        const key = `clients/${clientId}/clientState`;
                        const proven = await base.queryRawProof("ibc", (0, encoding_1.toAscii)(key), Number(proofHeight.revisionHeight));
                        const clientState = any_1.Any.decode(proven.value);
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            clientState,
                            proof,
                            proofHeight,
                        };
                    },
                    consensusState: async (clientId, consensusHeight, proofHeight) => {
                        const height = heightQueryString(consensusHeight);
                        const key = `clients/${clientId}/consensusStates/${height}`;
                        const proven = await base.queryRawProof("ibc", (0, encoding_1.toAscii)(key), Number(proofHeight.revisionHeight));
                        const consensusState = any_1.Any.decode(proven.value);
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            consensusState,
                            proof,
                            proofHeight,
                        };
                    },
                },
                connection: {
                    connection: async (connectionId, proofHeight) => {
                        const key = `connections/${connectionId}`;
                        const proven = await base.queryRawProof("ibc", (0, encoding_1.toAscii)(key), Number(proofHeight.revisionHeight));
                        const connection = connection_1.ConnectionEnd.decode(proven.value);
                        const proof = convertProofsToIcs23(proven.proof);
                        return {
                            connection,
                            proof,
                            proofHeight,
                        };
                    },
                },
            },
        },
    };
}
exports.setupIbcExtension = setupIbcExtension;
function convertProofsToIcs23(ops) {
    const proofs = ops.ops.map((op) => proofs_1.CommitmentProof.decode(op.data));
    const resp = commitment_1.MerkleProof.fromPartial({
        proofs,
    });
    return commitment_1.MerkleProof.encode(resp).finish();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWJjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9xdWVyaWVzL2liYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQ0FBMkM7QUFDM0MsdUNBQXNDO0FBQ3RDLCtDQUkwQjtBQUMxQixnRUFBc0U7QUFDdEUsMERBQXVEO0FBQ3ZELHNFQUFtRTtBQUNuRSxrRUFnQmdEO0FBRWhELGlFQVErQztBQUMvQywrRUFBNkU7QUFDN0UsK0VBQStFO0FBQy9FLHFFQVFtRDtBQUNuRCx1RkFHZ0U7QUFHaEUsU0FBUyw4QkFBOEIsQ0FDckMsV0FBNEI7SUFFNUIsSUFBSSxXQUFXLEVBQUUsT0FBTyxLQUFLLDZDQUE2QyxFQUFFO1FBQzFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0tBQzFFO0lBQ0QsT0FBTyx3QkFBcUIsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRCxTQUFTLGlDQUFpQyxDQUN4QyxXQUE0QjtJQUU1QixJQUNFLFdBQVcsRUFBRSxPQUFPLEtBQUssZ0RBQWdELEVBQ3pFO1FBQ0EsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLDJCQUF3QixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE1BQWM7SUFDOUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzdELENBQUM7QUFGRCw4Q0FFQztBQWtMRCxTQUFnQixpQkFBaUIsQ0FBQyxJQUFpQjtJQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFBLGtDQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFDLCtEQUErRDtJ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