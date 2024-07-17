"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const ava_1 = __importDefault(require("ava"));
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
const link_1 = require("../../../lib/link");
const signing_client_1 = require("../../utils/signing-client");
const { TestLogger } = lib_1.testutils;
const { ics20 } = lib_1.testutils;
const chains_1 = require("./chains");
const channels_1 = require("./channels");
const fsReadFileSync = sinon_1.default.stub(fs_1.default, "readFileSync");
const consoleLog = sinon_1.default.stub(console, "log");
const mnemonic = "enlist hip relief stomach skate base shallow young switch frequent cry park";
const registryYaml = `
version: 1

chains:
  local_wasm:
    chain_id: testing
    prefix: wasm
    gas_price: 0.025ucosm
    rpc:
      - http://localhost:26659
  local_gaia:
    chain_id: gaia-testing
    prefix: cosmos
    gas_price: 0.025uatom
    rpc:
      - http://localhost:26655`;
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
let channel;
let link;
ava_1.default.before(async () => {
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    link = await link_1.Link.createWithNewConnections(ibcClientGaia, ibcClientWasm);
    channel = await link.createChannel("A", chains_1.gaiaChain.ics20Port, chains_1.wasmdChain.ics20Port, ics20.ordering, ics20.version);
});
(0, ava_1.default)("lists channels for given chain (A)", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: null,
        connection: null,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    const output = consoleLog.getCall(-1);
    t.assert(output.calledWithMatch(new RegExp([
        channel.src.channelId,
        channel.src.portId,
        link.endA.connectionID,
        (0, channels_1.channelStateAsText)(channel_1.State.STATE_OPEN),
    ].join("\\s+"), "m")));
});
(0, ava_1.default)("lists channels for given chain (B)", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_wasm",
        port: null,
        connection: null,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    const output = consoleLog.getCall(-1);
    t.assert(output.calledWithMatch(new RegExp([
        channel.dest.channelId,
        channel.dest.portId,
        link.endB.connectionID,
        (0, channels_1.channelStateAsText)(channel_1.State.STATE_OPEN),
    ].join("\\s+"), "m")));
});
(0, ava_1.default)("filters channels by port", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: channel.src.portId,
        connection: null,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    const output = consoleLog.getCall(-1).args[0];
    const everyChannelHasValidPort = output
        .split(os_1.default.EOL)
        .slice(1, -1) // remove table head and last empty line
        .every((value) => new RegExp(`[^\\s]+\\s+${options.port}\\s+[^\\s]+\\s+[^\\s]+`).test(value));
    t.notRegex(output, /No channels found/);
    t.assert(everyChannelHasValidPort);
});
(0, ava_1.default)("filters channels by port (non-existing port)", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: "unknown_port",
        connection: null,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    t.assert(consoleLog.getCall(-1).calledWithMatch(/No channels found/));
});
(0, ava_1.default)("filters channels by connection", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_wasm",
        port: null,
        connection: link.endA.connectionID,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    const output = consoleLog.getCall(-1).args[0];
    const everyChannelHasValidConnection = output
        .split(os_1.default.EOL)
        .slice(1, -1) // remove table head and last empty line
        .every((value) => new RegExp(`[^\\s]+\\s+[^\\s]+\\s+${options.connection}\\s+[^\\s]+`).test(value));
    t.notRegex(output, /No channels found/);
    t.assert(everyChannelHasValidConnection);
});
(0, ava_1.default)("filters channels by connection (non-existing connection)", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: null,
        connection: "unknown_connection",
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    t.assert(consoleLog.getCall(-1).calledWithMatch(/No channels found/));
});
(0, ava_1.default)("filters channels by port and connection", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: channel.src.portId,
        connection: link.endA.connectionID,
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    const output = consoleLog.getCall(-1).args[0];
    const everyChannelHasValidPortAndConnection = output
        .split(os_1.default.EOL)
        .slice(1, -1) // remove table head and last empty line
        .every((value) => new RegExp(`[^\\s]+\\s+${options.port}\\s+${options.connection}\\s+[^\\s]+`).test(value));
    t.notRegex(output, /No channels found/);
    t.assert(everyChannelHasValidPortAndConnection);
});
(0, ava_1.default)("filters channels by port and connection (non-existing connection)", async (t) => {
    const logger = new TestLogger();
    const options = {
        chain: "local_gaia",
        port: channel.src.portId,
        connection: "unknown_connection",
        mnemonic: null,
        home: "/home/user",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channels_1.run)(options, logger);
    t.assert(consoleLog.getCall(-1).calledWithMatch(/No channels found/));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbm5lbHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2NoYW5uZWxzLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsNENBQW9CO0FBRXBCLDhDQUF1QjtBQUN2QixzRUFBaUY7QUFDakYsa0RBQTBCO0FBRTFCLHNDQUF5QztBQUN6Qyw0Q0FBc0Q7QUFFdEQsK0RBQTJEO0FBRTNELE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxlQUFTLENBQUM7QUFFakMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLGVBQVMsQ0FBQztBQUU1QixxQ0FBaUQ7QUFDakQseUNBQThEO0FBRTlELE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3RELE1BQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRTlDLE1BQU0sUUFBUSxHQUNaLDZFQUE2RSxDQUFDO0FBRWhGLE1BQU0sWUFBWSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7K0JBZVUsQ0FBQztBQUVoQyxhQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNuQixlQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE9BQW9CLENBQUM7QUFDekIsSUFBSSxJQUFVLENBQUM7QUFFZixhQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBQ3JCLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBQSw4QkFBYSxFQUFDLGtCQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0QsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQUMsbUJBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRSxJQUFJLEdBQUcs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