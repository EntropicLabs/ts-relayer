"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.ics20 = exports.defaults = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const js_yaml_1 = __importDefault(require("js-yaml"));
const link_1 = require("../../../lib/link");
const constants_1 = require("../../constants");
const indent_1 = require("../../utils/indent");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_option_1 = require("../../utils/options/resolve-option");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
const signing_client_1 = require("../../utils/signing-client");
exports.defaults = {
    port: "transfer",
};
function resolveConnections({ srcConnection, destConnection, }) {
    if (!srcConnection && destConnection) {
        throw new Error(`You have defined "destConnection" but no "srcConnection". Both "srcConnection" and "destConnection" must be present.`);
    }
    if (srcConnection && !destConnection) {
        throw new Error(`You have defined "srcConnection" but no "destConnection". Both "srcConnection" and "destConnection" must be present.`);
    }
    if (srcConnection && destConnection) {
        return {
            src: srcConnection,
            dest: destConnection,
        };
    }
    return null;
}
async function ics20(flags, logger) {
    const home = (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home });
    const app = (0, load_and_validate_app_1.loadAndValidateApp)(home);
    if (!app) {
        throw new Error(`${constants_1.appFile} not found at ${home}`);
    }
    const keyFile = (0, resolve_key_file_option_1.resolveKeyFileOption)({ keyFileFlag: flags.keyFile, app });
    const mnemonic = await (0, resolve_mnemonic_option_1.resolveMnemonicOption)({
        interactiveFlag: flags.interactive,
        mnemonicFlag: flags.mnemonic,
        keyFile,
        app,
    });
    const src = (0, resolve_option_1.resolveOption)("src", { required: true })(app.src);
    const dest = (0, resolve_option_1.resolveOption)("dest", { required: true })(app.dest);
    // we apply default ports later, once we have the registry
    const srcPort = (0, resolve_option_1.resolveOption)("srcPort")(flags.srcPort, process.env.RELAYER_SRC_PORT);
    const destPort = (0, resolve_option_1.resolveOption)("destPort")(flags.destPort, process.env.RELAYER_DEST_PORT);
    const srcTrust = (0, resolve_option_1.resolveOption)("srcTrust", { integer: true })(flags.srcTrust, process.env.RELAYER_SRC_TRUST);
    const destTrust = (0, resolve_option_1.resolveOption)("destTrust", { integer: true })(flags.destTrust, process.env.RELAYER_DEST_TRUST);
    const connections = resolveConnections(app);
    await run({
        src,
        dest,
        home,
        mnemonic,
        srcPort,
        destPort,
        connections,
        srcTrust,
        destTrust,
    }, app, logger);
}
exports.ics20 = ics20;
async function resolveLink(nodeA, nodeB, { connections, srcTrust, destTrust }, logger) {
    if (connections) {
        const link = await link_1.Link.createWithExistingConnections(nodeA, nodeB, connections.src, connections.dest, logger);
        console.log(`Used existing connections [${link.endA.chainId()}, ${link.endA.connectionID}, ${link.endA.clientID}] <=> [${link.endB.chainId()}, ${link.endB.connectionID}, ${link.endB.clientID}]`);
        return link;
    }
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger, srcTrust, destTrust);
    console.log(`Created connections [${link.endA.chainId()}, ${link.endA.connectionID}, ${link.endA.clientID}] <=> [${link.endB.chainId()}, ${link.endB.connectionID}, ${link.endB.clientID}]`);
    return link;
}
async function run(options, app, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const { chains } = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const srcChain = chains[options.src];
    if (!srcChain) {
        throw new Error("src chain not found in registry");
    }
    const destChain = chains[options.dest];
    if (!destChain) {
        throw new Error("dest chain not found in registry");
    }
    const ordering = channel_1.Order.ORDER_UNORDERED;
    const version = "ics20-1";
    const nodeA = await (0, signing_client_1.signingClient)(srcChain, options.mnemonic, logger);
    const nodeB = await (0, signing_client_1.signingClient)(destChain, options.mnemonic, logger);
    const link = await resolveLink(nodeA, nodeB, options, logger);
    const srcConnection = link.endA.connectionID;
    const destConnection = link.endB.connectionID;
    const appFilePath = path_1.default.join(options.home, constants_1.appFile);
    const appYaml = js_yaml_1.default.dump({
        ...app,
        srcConnection,
        destConnection,
    }, {
        lineWidth: 1000,
    });
    fs_1.default.writeFileSync(appFilePath, appYaml, { encoding: "utf-8" });
    // provide default port, either from registry or global default
    const srcPort = (0, resolve_option_1.resolveOption)("src-port", { required: true })(options.srcPort, srcChain.ics20_port, exports.defaults.port);
    const destPort = (0, resolve_option_1.resolveOption)("dest-port", { required: true })(options.destPort, destChain.ics20_port, exports.defaults.port);
    const channel = await link.createChannel("A", srcPort, destPort, ordering, version);
    const output = [
        "Created channel:",
        ...(0, indent_1.indent)([
            `${srcChain.chain_id}: ${channel.src.portId}/${channel.src.channelId} (${link.endA.connectionID})`,
            `${destChain.chain_id}: ${channel.dest.portId}/${channel.dest.channelId} (${link.endB.connectionID})`,
        ]),
    ].join(os_1.default.EOL);
    console.log(output);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNzMjAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9jb21tYW5kcy9pY3MyMC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4QixzRUFBaUU7QUFDakUsc0RBQTJCO0FBRzNCLDRDQUF5QztBQUN6QywrQ0FBd0Q7QUFHeEQsK0NBQTRDO0FBQzVDLDZFQUF1RTtBQUN2RSx1RkFBaUY7QUFDakYsdUVBQW1FO0FBQ25FLHdGQUFtRjtBQUNuRixnR0FBMEY7QUFDMUYsZ0dBQTJGO0FBQzNGLCtEQUEyRDtBQThCOUMsUUFBQSxRQUFRLEdBQUc7SUFDdEIsSUFBSSxFQUFFLFVBQVU7Q0FDakIsQ0FBQztBQUVGLFNBQVMsa0JBQWtCLENBQUMsRUFDMUIsYUFBYSxFQUNiLGNBQWMsR0FDSjtJQUNWLElBQUksQ0FBQyxhQUFhLElBQUksY0FBYyxFQUFFO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2Isc0hBQXNILENBQ3ZILENBQUM7S0FDSDtJQUVELElBQUksYUFBYSxJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQ2Isc0hBQXNILENBQ3ZILENBQUM7S0FDSDtJQUVELElBQUksYUFBYSxJQUFJLGNBQWMsRUFBRTtRQUNuQyxPQUFPO1lBQ0wsR0FBRyxFQUFFLGFBQWE7WUFDbEIsSUFBSSxFQUFFLGNBQWM7U0FDckIsQ0FBQztLQUNIO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRU0sS0FBSyxVQUFVLEtBQUssQ0FBQyxLQUFZLEVBQUUsTUFBYztJQUN0RCxNQUFNLElBQUksR0FBRyxJQUFBLHVDQUFpQixFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUEsMENBQWtCLEVBQUMsSUFBSSxD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