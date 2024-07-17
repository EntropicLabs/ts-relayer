"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = void 0;
const encoding_1 = require("@cosmjs/encoding");
const stargate_1 = require("@cosmjs/stargate");
const utils_1 = require("./utils");
/**
 * Endpoint is a wrapper around SigningStargateClient as well as ClientID
 * and ConnectionID. Two Endpoints compose a Link and this should expose all the
 * methods you need to work on one half of an IBC Connection, the higher-level
 * orchestration is handled in Link.
 */
class Endpoint {
    constructor(client, clientID, connectionID) {
        this.client = client;
        this.clientID = clientID;
        this.connectionID = connectionID;
    }
    chainId() {
        return this.client.chainId;
    }
    async getLatestCommit() {
        return this.client.getCommit();
    }
    async getPacketsFromBlockEvents({ minHeight, maxHeight, } = {}) {
        let query = `send_packet.packet_connection='${this.connectionID}'`;
        if (minHeight) {
            query = `${query} AND block.height>=${minHeight}`;
        }
        if (maxHeight) {
            query = `${query} AND block.height<=${maxHeight}`;
        }
        const search = await this.client.tm.blockSearchAll({ query });
        const resultsNested = await Promise.all(search.blocks.map(async ({ block }) => {
            const height = block.header.height;
            const result = await this.client.tm.blockResults(height);
            return (0, utils_1.parsePacketsFromBlockResult)(result).map((packet) => ({
                packet,
                height,
                sender: "",
            }));
        }));
        return [].concat(...resultsNested);
    }
    async getPacketsFromTxs({ minHeight, maxHeight, } = {}) {
        let query = `send_packet.packet_connection='${this.connectionID}'`;
        if (minHeight) {
            query = `${query} AND tx.height>=${minHeight}`;
        }
        if (maxHeight) {
            query = `${query} AND tx.height<=${maxHeight}`;
        }
        const search = await this.client.tm.txSearchAll({ query });
        const resultsNested = search.txs.map(({ height, result }) => (0, utils_1.parsePacketsFromTendermintEvents)(result.events).map((packet) => ({
            packet,
            height,
        })));
        return resultsNested.flat();
    }
    // returns all packets (auto-paginates, so be careful about not setting a minHeight)
    async querySentPackets({ minHeight, maxHeight, } = {}) {
        const txsPackets = await this.getPacketsFromTxs({ minHeight, maxHeight });
        const eventsPackets = await this.getPacketsFromBlockEvents({
            minHeight,
            maxHeight,
        });
        return []
            .concat(...txsPackets)
            .concat(...eventsPackets);
    }
    // returns all acks (auto-paginates, so be careful about not setting a minHeight)
    async queryWrittenAcks({ minHeight, maxHeight, } = {}) {
        let query = `write_acknowledgement.packet_connection='${this.connectionID}'`;
        if (minHeight) {
            query = `${query} AND tx.height>=${minHeight}`;
        }
        if (maxHeight) {
            query = `${query} AND tx.height<=${maxHeight}`;
        }
        const search = await this.client.tm.txSearchAll({ query });
        const out = search.txs.flatMap(({ height, result, hash }) => {
            const events = result.events.map(stargate_1.fromTendermintEvent);
            // const sender = logs.findAttribute(parsedLogs, 'message', 'sender').value;
            return (0, utils_1.parseAcksFromTxEvents)(events).map((ack) => ({
                height,
                txHash: (0, encoding_1.toHex)(hash).toUpperCase(),
                txEvents: events,
                ...ack,
            }));
        });
        return out;
    }
}
exports.Endpoint = Endpoint;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kcG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2VuZHBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtDQUF5QztBQUN6QywrQ0FBOEQ7QUFLOUQsbUNBS2lCO0FBNEJqQjs7Ozs7R0FLRztBQUNILE1BQWEsUUFBUTtJQUtuQixZQUNFLE1BQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLFlBQW9CO1FBRXBCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO0lBQ25DLENBQUM7SUFFTSxPQUFPO1FBQ1osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUM3QixDQUFDO0lBRU0sS0FBSyxDQUFDLGVBQWU7UUFHMUIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFTyxLQUFLLENBQUMseUJBQXlCLENBQUMsRUFDdEMsU0FBUyxFQUNULFNBQVMsTUFDSSxFQUFFO1FBQ2YsSUFBSSxLQUFLLEdBQUcsa0NBQWtDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQztRQUNuRSxJQUFJLFNBQVMsRUFBRTtZQUNiLEtBQUssR0FBRyxHQUFHLEtBQUssc0JBQXNCLFNBQVMsRUFBRSxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxTQUFTLEVBQUU7WUFDYixLQUFLLEdBQUcsR0FBRyxLQUFLLHNCQUFzQixTQUFTLEVBQUUsQ0FBQztTQUNuRDtRQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5RCxNQUFNLGFBQWEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FB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