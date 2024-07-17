"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@cosmjs/utils");
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
const link_1 = require("../../../lib/link");
const constants_1 = require("../../constants");
const signing_client_1 = require("../../utils/signing-client");
const chains_1 = require("./chains");
const ics20_1 = require("./ics20");
const { TestLogger } = lib_1.testutils;
const fsWriteFileSync = sinon_1.default.stub(fs_1.default, "writeFileSync");
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
const app = {
    src: "local_wasm",
    dest: "local_gaia",
};
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
ava_1.default.serial("ics20 create channels with new connection", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const allConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const allConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_wasm",
        dest: "local_gaia",
        srcPort: "transfer",
        destPort: "custom",
        connections: null,
        srcTrust: null,
        destTrust: null,
    };
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, ics20_1.run)(options, app, logger);
    const args = fsWriteFileSync.getCall(0).args;
    const contentsRegexp = new RegExp(`src: local_wasm
dest: local_gaia
srcConnection: .+
destConnection: .+
`);
    t.assert(fsWriteFileSync.calledOnce);
    t.is(args[0], path_1.default.join(options.home, constants_1.appFile));
    t.regex(args[1], contentsRegexp);
    t.is(consoleLog.callCount, 2);
    t.assert(consoleLog.calledWithMatch(/Created connections/));
    t.assert(consoleLog.calledWithMatch(/Created channel/));
    const nextAllConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const srcConnectionIdMatch = /srcConnection: (?<connection>.+)/.exec(args[1]);
    const srcConnectionId = srcConnectionIdMatch?.groups?.connection;
    (0, utils_1.assert)(srcConnectionId);
    const nextConnectionWasm = await ibcClientWasm.query.ibc.connection.connection(srcConnectionId);
    const nextAllConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const destConnectionIdMatch = /destConnection: (?<connection>.+)/.exec(args[1]);
    const destConnectionId = destConnectionIdMatch?.groups?.connection;
    (0, utils_1.assert)(destConnectionId);
    const nextConnectionGaia = await ibcClientGaia.query.ibc.connection.connection(destConnectionId);
    t.is(nextAllConnectionsWasm.connections.length, allConnectionsWasm.connections.length + 1);
    t.is(nextAllConnectionsGaia.connections.length, allConnectionsGaia.connections.length + 1);
    t.assert(nextConnectionWasm.connection);
    t.assert(nextConnectionGaia.connection);
});
ava_1.default.serial("ics20 create channels with existing connection", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const link = await link_1.Link.createWithNewConnections(ibcClientWasm, ibcClientGaia);
    const allConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const allConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_wasm",
        dest: "local_gaia",
        srcPort: "transfer",
        destPort: "custom",
        connections: {
            src: link.endA.connectionID,
            dest: link.endB.connectionID,
        },
        srcTrust: null,
        destTrust: null,
    };
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, ics20_1.run)(options, app, logger);
    const args = fsWriteFileSync.getCall(0).args;
    const contentsRegexp = new RegExp(`src: local_wasm
dest: local_gaia
srcConnection: ${link.endA.connectionID}
destConnection: ${link.endB.connectionID}
`);
    t.assert(fsWriteFileSync.calledOnce);
    t.is(args[0], path_1.default.join(options.home, constants_1.appFile));
    t.regex(args[1], contentsRegexp);
    t.assert(consoleLog.calledTwice);
    t.assert(consoleLog.calledWithMatch(/Used existing connections/));
    t.assert(consoleLog.calledWithMatch(/Created channel/));
    const nextAllConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const nextAllConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    t.is(nextAllConnectionsWasm.connections.length, allConnectionsWasm.connections.length);
    t.is(nextAllConnectionsGaia.connections.length, allConnectionsGaia.connections.length);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNzMjAuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2ljczIwLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLHlDQUF1QztBQUN2Qyw4Q0FBdUI7QUFDdkIsa0RBQTBCO0FBRTFCLHNDQUF5QztBQUN6Qyw0Q0FBeUM7QUFDekMsK0NBQTBDO0FBRTFDLCtEQUEyRDtBQUUzRCxxQ0FBaUQ7QUFDakQsbUNBQXVDO0FBRXZDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxlQUFTLENBQUM7QUFFakMsTUFBTSxlQUFlLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDeEQsTUFBTSxjQUFjLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdEQsTUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFOUMsTUFBTSxRQUFRLEdBQ1osNkVBQTZFLENBQUM7QUFFaEYsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7OzsrQkFlVSxDQUFDO0FBRWhDLE1BQU0sR0FBRyxHQUFHO0lBQ1YsR0FBRyxFQUFFLFlBQVk7SUFDakIsSUFBSSxFQUFFLFlBQVk7Q0FDbkIsQ0FBQztBQUVGLGFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLGVBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQztBQUVILGFBQUksQ0FBQyxNQUFNLENBQUMsMkNBQTJDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ25FLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7SUFFaEMsTUFBTSxhQUFhLEdBQUcsTUFBTSxJ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