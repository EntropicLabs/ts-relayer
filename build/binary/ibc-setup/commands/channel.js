"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.channel = exports.defaults = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
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
    version: "ics20-1",
};
async function channel(flags, logger) {
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
    const srcConnection = (0, resolve_option_1.resolveOption)("srcConnection", { required: true })(flags.srcConnection, app.srcConnection, process.env.RELAYER_SRC_CONNECTION);
    const destConnection = (0, resolve_option_1.resolveOption)("destConnection", { required: true })(flags.destConnection, app.destConnection, process.env.RELAYER_DEST_CONNECTION);
    const srcPort = (0, resolve_option_1.resolveOption)("srcPort", { required: true })(flags.srcPort, process.env.RELAYER_SRC_PORT);
    const destPort = (0, resolve_option_1.resolveOption)("destPort", { required: true })(flags.destPort, process.env.RELAYER_DEST_PORT);
    const version = (0, resolve_option_1.resolveOption)("version")(flags.version, process.env.RELAYER_VERSION) ??
        exports.defaults.version;
    const options = {
        home,
        mnemonic,
        src,
        dest,
        srcConnection,
        destConnection,
        srcPort,
        destPort,
        version,
        ordered: flags.ordered,
    };
    await run(options, logger);
}
exports.channel = channel;
async function run(options, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const srcChain = registry.chains[options.src];
    if (!srcChain) {
        throw new Error(`src channel "${options.src}" not found in registry`);
    }
    const destChain = registry.chains[options.dest];
    if (!destChain) {
        throw new Error(`dest channel "${options.dest}" not found in registry`);
    }
    const nodeA = await (0, signing_client_1.signingClient)(srcChain, options.mnemonic, logger.child({ label: srcChain.chain_id }));
    const nodeB = await (0, signing_client_1.signingClient)(destChain, options.mnemonic, logger.child({ label: destChain.chain_id }));
    const link = await link_1.Link.createWithExistingConnections(nodeA, nodeB, options.srcConnection, options.destConnection, logger);
    const ordering = options.ordered
        ? channel_1.Order.ORDER_ORDERED
        : channel_1.Order.ORDER_UNORDERED;
    const channel = await link.createChannel("A", options.srcPort, options.destPort, ordering, options.version);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbm5lbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2NoYW5uZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4QixzRUFBaUU7QUFFakUsNENBQXlDO0FBQ3pDLCtDQUF3RDtBQUV4RCwrQ0FBNEM7QUFDNUMsNkVBQXVFO0FBQ3ZFLHVGQUFpRjtBQUNqRix1RUFBbUU7QUFDbkUsd0ZBQW1GO0FBQ25GLGdHQUEwRjtBQUMxRixnR0FBMkY7QUFDM0YsK0RBQTJEO0FBNEI5QyxRQUFBLFFBQVEsR0FBRztJQUN0QixPQUFPLEVBQUUsU0FBUztDQUNuQixDQUFDO0FBRUssS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUFZLEVBQUUsTUFBYztJQUN4RCxNQUFNLElBQUksR0FBRyxJQUFBLHVDQUFpQixFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUEsMENBQWtCLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxtQkFBTyxpQkFBaUIsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUNwRDtJQUVELE1BQU0sT0FBTyxHQUFHLElBQUEsOENBQW9CLEVBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSwrQ0FBcUIsRUFBQztRQUMzQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVc7UUFDbEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxRQUFRO1FBQzVCLE9BQU87UUFDUCxHQUFHO0tBQ0osQ0FBQyxDQUFDO0lBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBQSw4QkFBYSxFQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFhLEVBQUMsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sYUFBYSxHQUFHLElBQUEsOEJBQWEsRUFBQyxlQUFlLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FDdEUsS0FBSyxDQUFDLGFBQWEsRUFDbkIsR0FBRyxDQUFDLGFBQWEsRUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FDbkMsQ0FBQztJQUNGLE1BQU0sY0FBYyxHQUFHLElBQUEsOEJBQWEsRUFBQyxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUN4RSxLQUFLLENBQUMsY0FBYyxFQUNwQixHQUFHLENBQUMsY0FBYyxFQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUNwQyxDQUFDO0lBQ0YsTUFBTSxPQUFPLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUMxRCxLQUFLLENBQUMsT0FBTyxFQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQzdCLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLDhCQUFhLEVBQUMsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQzVELEtBQUssQ0FBQyxRQUFRLEVBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FDOUIsQ0FBQztJQUNGLE1BQU0sT0FBTyxHQUNYLElBQUEsOEJBQWEsRUFBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO1FBQ3BFLGdCQUFRLENBQUMsT0FBTyxDQUFDO0lBRW5CLE1BQU0sT0FBTyxHQUFZO1FBQ3ZCLElBQUk7UUFDSixRQUFRO1FBQ1IsR0FBRztRQUNILElBQUk7UUFDSixhQUFhO1FBQ2IsY0FBYztRQUNkLE9BQU87UUFDUCxRQUFRO1FBQ1IsT0FBTztRQUNQLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztLQUN2QixDQUFDO0lBRUYsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFwREQsMEJBb0RDO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxPQUFnQixFQUFFLE1BQWM7SUFDeEQsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsd0JBQVksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUEsb0RBQXVCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsT0FBTyxDQUFDLEdBQUcseUJBQXlCLENBQUMsQ0FBQztLQUN2RTtJQUNELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixPQUFPLENBQUMsSUFBSSx5QkFBeUIsQ0FBQyxDQUFDO0tBQ3pFO0lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQy9CLFFBQVEsRUFDUixPQUFPLENBQUMsUUFBUSxFQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUMzQyxDQUFDO0lBQ0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQy9CLFNBQVMsRUFDVCxPQUFPLENBQUMsUUFBUSxFQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUM1QyxDQUFDO0lBRUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFJLENBQUMsNkJBQTZCLENBQ25ELEtBQUssRUFDTCxLQUFLLEVBQ0wsT0FBTyxDQUFDLGFBQWEsRUFDckIsT0FBTyxDQUFDLGNBQWMsRUFDdEIsTUFBTSxDQUNQLENBQUM7SUFFRixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTztRQUM5QixDQUFDLENBQUMsZUFBSyxDQUFDLGFBQWE7UUFDckIsQ0FBQyxDQUFDLGVBQUssQ0FBQyxlQUFlLENBQUM7SUFFMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUN0QyxHQUFHLEVBQ0gsT0FBTyxDQUFDLE9BQU8sRUFDZixPQUFPLENBQUMsUUFBUSxFQUNoQixRQUFRLEVBQ1IsT0FBTyxDQUFDLE9BQU8sQ0FDaEIsQ0FBQztJQUVGLE1BQU0sTUFBTSxHQUFHO1FBQ2Isa0JBQWtCO1FBQ2xCLEdBQUcsSUFBQSxlQUFNLEVBQUM7WUFDUixHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUc7WUFDbEcsR0FBRyxTQUFTLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHO1NBQ3RHLENBQUM7S0FDSCxDQUFDLElBQUksQ0FBQyxZQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFZixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFwREQsa0JBb0RDIn0=