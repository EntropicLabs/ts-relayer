"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
const ibcclient_1 = require("../../../lib/ibcclient");
const balances_1 = require("./balances");
const { TestLogger } = lib_1.testutils;
const fsReadFileSync = sinon_1.default.stub(fs_1.default, "readFileSync");
const consoleLog = sinon_1.default.stub(console, "log");
const mnemonic = "accident harvest weasel surge source return tag supreme sorry isolate wave mammal";
function buildIbcArgs(rpc) {
    return [rpc, sinon_1.default.match.any, sinon_1.default.match.any, sinon_1.default.match.any];
}
const ibcClient = sinon_1.default.stub(ibcclient_1.IbcClient, "connectWithSigner");
const musselnetArgs = buildIbcArgs("https://rpc.musselnet.cosmwasm.com:443");
const localWasmArgs = buildIbcArgs("http://localhost:26659");
const localGaiaArgs = buildIbcArgs("http://localhost:26655");
async function createFakeIbcClient(amount, denom) {
    return {
        query: {
            bank: {
                balance: sinon_1.default.fake.returns({ amount, denom }),
            },
        },
    };
}
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
const registryYaml = `
version: 1

chains:
  musselnet:
    chain_id: musselnet-4
    # bech32 prefix for addresses
    prefix: wasm
    # this determines the gas payments we make (and defines the fee token)
    gas_price: 0.025umayo
    # the path we use to derive the private key from the mnemonic
    hd_path: m/44'/108'/0'/1'
    # you can include multiple RPC endpoints and it will rotate through them if
    # one is down
    rpc:
      - https://rpc.musselnet.cosmwasm.com:443
  local_wasm:
    chain_id: testing
    prefix: wasm
    gas_price: 0.025ucosm
    hd_path: m/44'/108'/0'/2'
    rpc:
      - http://localhost:26659
  local_gaia:
    chain_id: gaia-testing
    prefix: cosmos
    gas_price: 0.025uatom
    hd_path: m/44'/1234'/0'/3'
    rpc:
      - http://localhost:26655`;
(0, ava_1.default)("lists chains with non-zero balance", async (t) => {
    const logger = new TestLogger();
    const options = {
        home: "/home/user",
        mnemonic,
    };
    fsReadFileSync.returns(registryYaml);
    ibcClient
        .withArgs(...musselnetArgs)
        .returns(createFakeIbcClient("1", "musselnetdenom"))
        .withArgs(...localWasmArgs)
        .returns(createFakeIbcClient("2", "wasmdenom"))
        .withArgs(...localGaiaArgs)
        .returns(createFakeIbcClient("3", "gaiadenom"));
    await (0, balances_1.run)(options, logger);
    t.assert(fsReadFileSync.calledOnce);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(new RegExp([
        "musselnet\\s+1musselnetdenom\\s+",
        "local_wasm\\s+2wasmdenom\\s+",
        "local_gaia\\s+3gaiadenom\\s+",
    ].join(os_1.default.EOL))));
});
(0, ava_1.default)("omits chains with zero balance", async (t) => {
    const logger = new TestLogger();
    const options = {
        home: "/home/user",
        mnemonic,
    };
    fsReadFileSync.returns(registryYaml);
    ibcClient
        .withArgs(...musselnetArgs)
        .returns(createFakeIbcClient("1", "musselnetdenom"))
        .withArgs(...localWasmArgs)
        .returns(createFakeIbcClient("0", "wasmdenom"))
        .withArgs(...localGaiaArgs)
        .returns(createFakeIbcClient("3", "gaiadenom"));
    await (0, balances_1.run)(options, logger);
    t.assert(fsReadFileSync.calledOnce);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(new RegExp([
        "musselnet\\s+1musselnetdenom\\s+",
        "local_gaia\\s+3gaiadenom\\s+",
    ].join(os_1.default.EOL))));
});
(0, ava_1.default)("informs when there are no funds on any balance", async (t) => {
    const logger = new TestLogger();
    const options = {
        home: "/home/user",
        mnemonic,
    };
    fsReadFileSync.returns(registryYaml);
    ibcClient
        .withArgs(...musselnetArgs)
        .returns(createFakeIbcClient("0", "musselnetdenom"))
        .withArgs(...localWasmArgs)
        .returns(createFakeIbcClient("0", "wasmdenom"))
        .withArgs(...localGaiaArgs)
        .returns(createFakeIbcClient("0", "gaiadenom"));
    await (0, balances_1.run)(options, logger);
    t.assert(fsReadFileSync.calledOnce);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(/No funds/));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2JhbGFuY2VzLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsNENBQW9CO0FBRXBCLDhDQUF1QjtBQUN2QixrREFBMEI7QUFFMUIsc0NBQXlDO0FBQ3pDLHNEQUFtRDtBQUduRCx5Q0FBaUM7QUFHakMsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLGVBQVMsQ0FBQztBQUVqQyxNQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDLFlBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUN0RCxNQUFNLFVBQVUsR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5QyxNQUFNLFFBQVEsR0FDWixtRkFBbUYsQ0FBQztBQUV0RixTQUFTLFlBQVksQ0FBQyxHQUFXO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLEVBQUUsZUFBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsZUFBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsZUFBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQVUsQ0FBQztBQUMzRSxDQUFDO0FBQ0QsTUFBTSxTQUFTLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxxQkFBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDN0QsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFDN0UsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDN0QsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFN0QsS0FBSyxVQUFVLG1CQUFtQixDQUFDLE1BQWMsRUFBRSxLQUFhO0lBQzlELE9BQU87UUFDTCxLQUFLLEVBQUU7WUFDTCxJQUFJ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