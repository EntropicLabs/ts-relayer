"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const generate_mnemonic_1 = require("../../utils/generate-mnemonic");
const keys_list_1 = require("./keys-list");
const fsReadFileSync = sinon_1.default.stub(fs_1.default, "readFileSync");
const consoleLog = sinon_1.default.stub(console, "log");
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
const registryYaml = `
version: 1

chains:
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
    hd_path: m/44'/108'/0'/3'
    rpc:
      - http://localhost:26655`;
(0, ava_1.default)("lists addresses for every chain in the registry", async (t) => {
    const options = {
        home: "/home/user",
        mnemonic: (0, generate_mnemonic_1.generateMnemonic)(),
    };
    fsReadFileSync.returns(registryYaml);
    await (0, keys_list_1.run)(options);
    t.assert(fsReadFileSync.calledOnce);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(/local_wasm: [a-z0-9]+\nlocal_gaia: [a-z0-9]+/));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5cy1saXN0LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9jb21tYW5kcy9rZXlzLWxpc3Quc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUVwQiw4Q0FBdUI7QUFDdkIsa0RBQTBCO0FBRTFCLHFFQUFpRTtBQUVqRSwyQ0FBMkM7QUFFM0MsTUFBTSxjQUFjLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdEQsTUFBTSxVQUFVLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFOUMsYUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7SUFDbkIsZUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7OytCQWlCVSxDQUFDO0FBRWhDLElBQUEsYUFBSSxFQUFDLGlEQUFpRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNsRSxNQUFNLE9BQU8sR0FBWTtRQUN2QixJQUFJLEVBQUUsWUFBWTtRQUNsQixRQUFRLEVBQUUsSUFBQSxvQ0FBZ0IsR0FBRTtLQUM3QixDQUFDO0lBRUYsY0FBYyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUVyQyxNQUFNLElBQUEsZUFBRyxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRW5CLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxNQUFNLENBQ04sVUFBVSxDQUFDLGVBQWUsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUMzRSxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMifQ==