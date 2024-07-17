"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const utils_1 = require("@cosmjs/utils");
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
const link_1 = require("../../../lib/link");
const indent_1 = require("../../utils/indent");
const signing_client_1 = require("../../utils/signing-client");
const { TestLogger } = lib_1.testutils;
const chains_1 = require("./chains");
const channel_1 = require("./channel");
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
ava_1.default.serial("creates channel for given connections and ports", async (t) => {
    const logger = new TestLogger();
    const ibcClientGaia = await (0, signing_client_1.signingClient)(chains_1.gaiaChain, mnemonic);
    const ibcClientWasm = await (0, signing_client_1.signingClient)(chains_1.wasmdChain, mnemonic);
    const link = await link_1.Link.createWithNewConnections(ibcClientWasm, ibcClientGaia);
    const options = {
        home: "/home/user",
        mnemonic,
        src: "local_wasm",
        dest: "local_gaia",
        srcConnection: link.endA.connectionID,
        destConnection: link.endB.connectionID,
        srcPort: "transfer",
        destPort: "custom",
        ordered: false,
        version: "ics20-1",
    };
    fsReadFileSync.returns(registryYaml);
    await (0, channel_1.run)(options, logger);
    t.assert(consoleLog.calledWithMatch(/Created channel:/));
    const output = consoleLog.getCall(-1).args[0];
    const match = output.match(new RegExp([
        "Created channel:",
        ...(0, indent_1.indent)([
            ".+: (?<srcPort>.+)/(?<srcChannel>.+) \\(.+\\)",
            ".+: (?<destPort>.+)/(?<destChannel>.+) \\(.+\\)",
        ]),
    ].join(os_1.default.EOL)));
    (0, utils_1.assert)(match);
    (0, utils_1.assert)(match.groups);
    const querySrcChannel = await ibcClientWasm.query.ibc.channel.channel(match.groups.srcPort, match.groups.srcChannel);
    t.assert(querySrcChannel.channel);
    const queryDestChannel = await ibcClientGaia.query.ibc.channel.channel(match.groups.destPort, match.groups.destChannel);
    t.assert(queryDestChannel.channel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbm5lbC5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMvY2hhbm5lbC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLDRDQUFvQjtBQUVwQix5Q0FBdUM7QUFDdkMsOENBQXVCO0FBQ3ZCLGtEQUEwQjtBQUUxQixzQ0FBeUM7QUFDekMsNENBQXlDO0FBRXpDLCtDQUE0QztBQUM1QywrREFBMkQ7QUFFM0QsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLGVBQVMsQ0FBQztBQUVqQyxxQ0FBaUQ7QUFDakQsdUNBQXlDO0FBRXpDLE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3RELE1BQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRTlDLE1BQU0sUUFBUSxHQUNaLDZFQUE2RSxDQUFDO0FBRWhGLE1BQU0sWUFBWSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7K0JBZVUsQ0FBQztBQUVoQyxhQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNuQixlQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxhQUFJLENBQUMsTUFBTSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUN6RSxNQUFNLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO0lBRWhDLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBQSw4QkFBYSxFQUFDLGtCQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0QsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQUMsbUJBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRSxNQUFNLElBQUksR0FBRyxNQUFNLFdBQUksQ0FBQyx3QkFBd0IsQ0FDOUMsYUFBYSxFQUNiLGFBQWEsQ0FDZCxDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQVk7UUFDdkIsSUFBSSxFQUFFLFlBQVk7UUFDbEIsUUFBUTtRQUNSLEdBQUcsRUFBRSxZQUFZO1FBQ2pCLElBQUksRUFBRSxZQUFZO1FBQ2xCLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVk7UUFDckMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWTtRQUN0QyxPQUFPLEVBQUUsVUFBVTtRQUNuQixRQUFRLEVBQUUsUUFBUTtRQUNsQixPQUFPLEVBQUUsS0FBSztRQUNkLE9BQU8sRUFBRSxTQUFTO0tBQ25CLENBQUM7SUFFRixjQUFjLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRXJDLE1BQU0sSUFBQSxhQUFHLEVBQUMsT0FBTyxFQUFFLE1BQTJCLENBQUMsQ0FBQztJQUVoRCxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0lBRXpELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFXLENBQUM7SUFDeEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FDeEIsSUFBSSxNQUFNLENBQ1I7UUFDRSxrQkFBa0I7UUFDbEIsR0FBRyxJQUFBLGVBQU0sRUFBQztZQUNSLCtDQUErQztZQUMvQyxpREFBaUQ7U0FDbEQsQ0FBQztLQUNILENBQUMsSUFBSSxDQUFDLFlBQUUsQ0FBQyxHQUFHLENBQUMsQ0FDZixDQUNGLENBQUM7SUFFRixJQUFBLGNBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQztJQUNkLElBQUEsY0FBTSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVyQixNQUFNLGVBQWUsR0FBRyxNQUFNLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQ25FLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUNwQixLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FDeEIsQ0FBQztJQUNGLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWxDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUNwRSxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDckIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQ3pCLENBQUM7SUFDRixDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDIn0=