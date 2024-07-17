"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.connections = void 0;
const path_1 = __importDefault(require("path"));
const connection_1 = require("cosmjs-types/ibc/core/connection/v1/connection");
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
async function connections(flags, logger) {
    const home = (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home });
    const app = (0, load_and_validate_app_1.loadAndValidateApp)(home);
    const keyFile = (0, resolve_key_file_option_1.resolveKeyFileOption)({ keyFileFlag: flags.keyFile, app });
    const chain = (0, resolve_option_1.resolveOption)("chain", { required: true })(flags.chain, process.env.RELAYER_CHAIN);
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
    };
    await run(options, logger);
}
exports.connections = connections;
function connectionStateAsText(state) {
    switch (state) {
        case connection_1.State.STATE_INIT:
            return "Init";
        case connection_1.State.STATE_OPEN:
            return "Open";
        case connection_1.State.STATE_TRYOPEN:
            return "Tryopen";
        case connection_1.State.STATE_UNINITIALIZED_UNSPECIFIED:
            return "UninitializedUnspecified";
        case connection_1.State.UNRECOGNIZED:
        default:
            return "Unrecognized";
    }
}
async function run(options, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const chain = registry.chains[options.chain];
    if (!chain) {
        throw new Error(`Chain ${options.chain} not found in ${registryFilePath}.`);
    }
    const mnemonic = options.mnemonic ?? (0, generate_mnemonic_1.generateMnemonic)();
    const client = await (0, signing_client_1.signingClient)(chain, mnemonic, logger);
    const { connections: allConnections } = await client.query.ibc.connection.allConnections();
    const connections = allConnections.map((connection) => [
        connection.id,
        connection.clientId,
        connection.delayPeriod.toString(10),
        connectionStateAsText(connection.state),
    ]);
    if (!connections.length) {
        console.log(`No connections found for chain "${options.chain}".`);
        return;
    }
    const output = (0, borderless_table_1.borderlessTable)([
        ["CONNECTION_ID", "CLIENT_ID", "DELAY", "STATE"],
        ...connections,
    ]);
    console.log(output);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9jb21tYW5kcy9jb25uZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBd0I7QUFFeEIsK0VBQTBGO0FBRzFGLCtDQUErQztBQUUvQyxtRUFBK0Q7QUFDL0QscUVBQWlFO0FBQ2pFLDZFQUF1RTtBQUN2RSx1RkFBaUY7QUFDakYsdUVBQW1FO0FBQ25FLHdGQUFtRjtBQUNuRixnR0FBMEY7QUFDMUYsZ0dBQTJGO0FBQzNGLCtEQUEyRDtBQWdCcEQsS0FBSyxVQUFVLFdBQVcsQ0FBQyxLQUFZLEVBQUUsTUFBYztJQUM1RCxNQUFNLElBQUksR0FBRyxJQUFBLHVDQUFpQixFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUEsMENBQWtCLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBQSw4Q0FBb0IsRUFBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDMUUsTUFBTSxLQUFLLEdBQUcsSUFBQSw4QkFBYSxFQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUN0RCxLQUFLLENBQUMsS0FBSyxFQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUMxQixDQUFDO0lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLCtDQUFxQixFQUMxQztRQUNFLGVBQWUsRUFBRSxLQUFLLENBQUMsV0FBVztRQUNsQyxZQUFZLEVBQUUsS0FBSyxDQUFDLFFBQVE7UUFDNUIsT0FBTztRQUNQLEdBQUc7S0FDSixFQUNELElBQUksQ0FDTCxDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQVk7UUFDdkIsSUFBSTtR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