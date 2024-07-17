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
const constants_1 = require("../../constants");
const signing_client_1 = require("../../utils/signing-client");
const chains_1 = require("./chains");
const connect_1 = require("./connect");
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
const registryYamlTooLowGas = `
version: 1

chains:
  local_wasm:
    chain_id: testing
    prefix: wasm
    gas_price: 0.001ucosm
    rpc:
      - http://localhost:26659
  local_gaia:
    chain_id: gaia-testing
    prefix: cosmos
    # this will fail
    gas_price: 0.001uatom
    rpc:
      - http://localhost:26655`;
const registryYamlHigherGas = `
version: 1

chains:
  local_wasm:
    chain_id: testing
    prefix: wasm
    gas_price: 0.075ucosm
    rpc:
      - http://localhost:26659
  local_gaia:
    chain_id: gaia-testing
    prefix: cosmos
    gas_price: 0.075uatom
    rpc:
      - http://localhost:26655`;
const app = {
    src: "local_wasm",
    dest: "local_gaia",
};
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
ava_1.default.serial("connects two chains", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const allConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const allConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_gaia",
        dest: "local_wasm",
        srcTrust: null,
        destTrust: null,
    };
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, connect_1.run)(options, app, logger);
    const args = fsWriteFileSync.getCall(0).args;
    const contentsRegexp = new RegExp(`src: local_wasm
dest: local_gaia
srcConnection: .+
destConnection: .+
`);
    t.assert(fsWriteFileSync.calledOnce);
    t.is(args[0], path_1.default.join(options.home, constants_1.appFile));
    t.regex(args[1], contentsRegexp);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(/Created connections/));
    const nextAllConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const destConnectionIdMatch = /destConnection: (?<connection>.+)/.exec(args[1]);
    const destConnectionId = destConnectionIdMatch?.groups?.connection;
    (0, utils_1.assert)(destConnectionId);
    const nextConnectionWasm = await ibcClientWasm.query.ibc.connection.connection(destConnectionId);
    const nextAllConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const srcConnectionIdMatch = /srcConnection: (?<connection>.+)/.exec(args[1]);
    const srcConnectionId = srcConnectionIdMatch?.groups?.connection;
    (0, utils_1.assert)(srcConnectionId);
    const nextConnectionGaia = await ibcClientGaia.query.ibc.connection.connection(srcConnectionId);
    t.is(nextAllConnectionsWasm.connections.length, allConnectionsWasm.connections.length + 1);
    t.is(nextAllConnectionsGaia.connections.length, allConnectionsGaia.connections.length + 1);
    t.assert(nextConnectionWasm.connection);
    t.assert(nextConnectionGaia.connection);
});
ava_1.default.serial("connects two chains fails with too low gas", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const allConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const allConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_gaia",
        dest: "local_wasm",
        srcTrust: null,
        destTrust: null,
    };
    fsReadFileSync.returns(registryYamlTooLowGas);
    fsWriteFileSync.returns();
    // this should throw an error when trying to set up the connection
    await t.throwsAsync(() => (0, connect_1.run)(options, app, logger));
    const nextAllConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const nextAllConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    // no connection can be made
    t.is(nextAllConnectionsWasm.connections.length, allConnectionsWasm.connections.length);
    t.is(nextAllConnectionsGaia.connections.length, allConnectionsGaia.connections.length);
});
ava_1.default.serial("connects two chains with explicit high gas works", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const allConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const allConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_gaia",
        dest: "local_wasm",
        srcTrust: null,
        destTrust: null,
    };
    fsReadFileSync.returns(registryYamlHigherGas);
    fsWriteFileSync.returns();
    // this will NOT fail
    await (0, connect_1.run)(options, app, logger);
    const nextAllConnectionsWasm = await ibcClientWasm.query.ibc.connection.allConnections();
    const nextAllConnectionsGaia = await ibcClientGaia.query.ibc.connection.allConnections();
    // one connection is made
    t.is(nextAllConnectionsWasm.connections.length, allConnectionsWasm.connections.length + 1);
    t.is(nextAllConnectionsGaia.connections.length, allConnectionsGaia.connections.length + 1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMvY29ubmVjdC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4Qix5Q0FBdUM7QUFDdkMsOENBQXVCO0FBQ3ZCLGtEQUEwQjtBQUUxQixzQ0FBeUM7QUFDekMsK0NBQTBDO0FBRTFDLCtEQUEyRDtBQUUzRCxxQ0FBaUQ7QUFDakQsdUNBQXlDO0FBRXpDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxlQUFTLENBQUM7QUFFakMsTUFBTSxlQUFlLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDeEQsTUFBTSxjQUFjLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdEQsTUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFOUMsTUFBTSxRQUFRLEdBQ1osNkVBQTZFLENBQUM7QUFFaEYsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7OzsrQkFlVSxDQUFDO0FBRWhDLE1BQU0scUJBQXFCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7K0JBZ0JDLENBQUM7QUFFaEMsTUFBTSxxQkFBcUIsR0FBRzs7Ozs7Ozs7Ozs7Ozs7OytCQWVDLENBQUM7QUFFaEMsTUFBTSxHQUFHLEdBQUc7SUFDVixHQUFHLEVBQUUsWUFBWTtJQUNqQixJQUFJLEVBQUUsWUFBWTtDQUNuQixDQUFDO0FBRUYsYUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7SUFDbkIsZUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDO0FBRUgsYUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxLQUFL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