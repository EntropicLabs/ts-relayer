"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
const link_1 = require("../../../lib/link");
const signing_client_1 = require("../../utils/signing-client");
const chains_1 = require("./chains");
const connections_1 = require("./connections");
const { TestLogger } = lib_1.testutils;
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
ava_1.default.serial("lists connections", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const link = await link_1.Link.createWithNewConnections(ibcClientGaia, ibcClientWasm);
    const options = {
        home: "/home/user",
        mnemonic,
        chain: "local_gaia",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, connections_1.run)(options, logger);
    const tableRow = [link.endA.connectionID, link.endA.clientID, 0, "Open"];
    const match = new RegExp(tableRow.join("\\s+"));
    t.assert(consoleLog.getCall(-1).calledWithMatch(match));
});
// TODO: #130
// test.serial('logs a message when no connections are found', async (t) => {
//   //
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbnMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2Nvbm5lY3Rpb25zLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0Q0FBb0I7QUFFcEIsOENBQXVCO0FBQ3ZCLGtEQUEwQjtBQUUxQixzQ0FBeUM7QUFDekMsNENBQXlDO0FBRXpDLCtEQUEyRDtBQUUzRCxxQ0FBaUQ7QUFDakQsK0NBQTZDO0FBRTdDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxlQUFTLENBQUM7QUFFakMsTUFBTSxjQUFjLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdEQsTUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFOUMsTUFBTSxRQUFRLEdBQ1osNkVBQTZFLENBQUM7QUFFaEYsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7OzsrQkFlVSxDQUFDO0FBRWhDLGFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLGVBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQztBQUVILGFBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7SUFFaEMsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQUMsa0JBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMvRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsOEJBQWEsRUFBQyxtQkFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRWhFLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBSSxDQUFDLHdCQUF3QixDQUM5QyxhQUFhLEVBQ2IsYUFBYSxDQUNkLENBQUM7SUFFRixNQUFNLE9BQU8sR0FBWTtRQUN2QixJQUFJLEVBQUUsWUFBWTtRQUNsQixRQUFRO1FBQ1IsS0FBSyxFQUFFLFlBQVk7S0FDcEIsQ0FBQztJQUVGLGNBQWMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFckMsTUFBTSxJQUFBLGlCQUFHLEVBQUMsT0FBTyxFQUFFLE1BQTJCLENBQUMsQ0FBQztJQUVoRCxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RSxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxDQUFDLENBQUM7QUFFSCxhQUFhO0FBQ2IsNkVBQTZFO0FBQzdFLE9BQU87QUFDUCxNQUFNIn0=