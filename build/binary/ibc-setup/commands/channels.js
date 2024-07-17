"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.channelStateAsText = exports.channels = void 0;
const path_1 = __importDefault(require("path"));
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const constants_1 = require("../../constants");
const borderless_table_1 = require("../../utils/borderless-table");
const generate_mnemonic_1 = require("../../utils/generate-mnemonic");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_option_1 = require("../../utils/options/resolve-option");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
const signing_client_1 = require("../../utils/signing-client");
async function channels(flags, logger) {
    const home = (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home });
    const app = (0, load_and_validate_app_1.loadAndValidateApp)(home);
    const keyFile = (0, resolve_key_file_option_1.resolveKeyFileOption)({ keyFileFlag: flags.keyFile, app });
    const chain = (0, resolve_option_1.resolveOption)("chain", { required: true })(flags.chain, process.env.RELAYER_CHAIN);
    const port = (0, resolve_option_1.resolveOption)("port")(flags.port, process.env.RELAYER_PORT);
    const connection = (0, resolve_option_1.resolveOption)("connection")(flags.connection, process.env.RELAYER_CONNECTION);
    const mnemonic = await (0, resolve_mnemonic_option_1.resolveMnemonicOption)({
        interactiveFlag: flags.interactive,
        mnemonicFlag: flags.mnemonic,
        keyFile,
        app,
    }, true);
    const options = {
        home,
        chain,
        mnemonic,
        port,
        connection,
    };
    await run(options, logger);
}
exports.channels = channels;
function channelStateAsText(state) {
    switch (state) {
        case channel_1.State.STATE_CLOSED:
            return "Closed";
        case channel_1.State.STATE_INIT:
            return "Init";
        case channel_1.State.STATE_OPEN:
            return "Open";
        case channel_1.State.STATE_TRYOPEN:
            return "Tryopen";
        case channel_1.State.STATE_UNINITIALIZED_UNSPECIFIED:
            return "UninitializedUnspecified";
        case channel_1.State.UNRECOGNIZED:
        default:
            return "Unrecognized";
    }
}
exports.channelStateAsText = channelStateAsText;
async function run(options, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const chain = registry.chains[options.chain];
    if (!chain) {
        throw new Error(`Chain ${options.chain} not found in ${registryFilePath}.`);
    }
    const mnemonic = options.mnemonic ?? (0, generate_mnemonic_1.generateMnemonic)();
    const client = await (0, signing_client_1.signingClient)(chain, mnemonic, logger);
    const { channels: allChannels } = await client.query.ibc.channel.allChannels();
    const channels = allChannels
        .filter((channel) => (options.port ? channel.portId === options.port : true))
        .filter((channel) => options.connection
        ? channel.connectionHops.includes(options.connection)
        : true)
        .map((channel) => [
        channel.channelId,
        channel.portId,
        channel.connectionHops.join(", "),
        channelStateAsText(channel.state),
    ]);
    if (!channels.length) {
        const conditionalPortInfo = options.port
            ? ` on port "${options.port}"`
            : "";
        const conditionalConnectionInfo = options.connection
            ? ` with connection "${options.connection}"`
            : "";
        console.log(`No channels found for chain "${options.chain}"${conditionalPortInfo}${conditionalConnectionInfo}.`);
        return;
    }
    const output = (0, borderless_table_1.borderlessTable)([
        ["CHANNEL_ID", "PORT", "CONNECTION(S)", "STATE"],
        ...channels,
    ]);
    console.log(output);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbm5lbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9jb21tYW5kcy9jaGFubmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBd0I7QUFFeEIsc0VBQWlGO0FBRWpGLCtDQUErQztBQUUvQyxtRUFBK0Q7QUFDL0QscUVBQWlFO0FBQ2pFLDZFQUF1RTtBQUN2RSx1RkFBaUY7QUFDakYsdUVBQW1FO0FBQ25FLHdGQUFtRjtBQUNuRixnR0FBMEY7QUFDMUYsZ0dBQTJGO0FBQzNGLCtEQUEyRDtBQW9CcEQsS0FBSyxVQUFVLFFBQVEsQ0FBQyxLQUFZLEVBQUUsTUFBYztJQUN6RCxNQUFNLElBQUksR0FBRyxJQUFBLHVDQUFpQixFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUEsMENBQWtCLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBQSw4Q0FBb0IsRUFBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDMUUsTUFBTSxLQUFLLEdBQUcsSUFBQSw4QkFBYSxFQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUN0RCxLQUFLLENBQUMsS0FBSyxFQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUMxQixDQUFDO0lBQ0YsTUFBTSxJQUFJLEdBQUcsSUFBQSw4QkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN6RSxNQUFNLFVBQVUsR0FBRyxJQUFBLDhCQUFhLEVBQUMsWUFBWSxDQUFDLENBQzVDLEtBQUssQ0FBQyxVQUFVLEVBQ2hCLE9BQU8sQ0FB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