"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.getAddresses = exports.keysList = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../constants");
const derive_address_1 = require("../../utils/derive-address");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
async function keysList(flags, _logger) {
    const home = (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home });
    const app = (0, load_and_validate_app_1.loadAndValidateApp)(home);
    const keyFile = (0, resolve_key_file_option_1.resolveKeyFileOption)({ keyFileFlag: flags.keyFile, app });
    const mnemonic = await (0, resolve_mnemonic_option_1.resolveMnemonicOption)({
        interactiveFlag: flags.interactive,
        mnemonicFlag: flags.mnemonic,
        keyFile,
        app,
    });
    const options = {
        home,
        mnemonic,
    };
    await run(options);
}
exports.keysList = keysList;
async function getAddresses(registryChains, mnemonic) {
    const chains = Object.entries(registryChains);
    return (await Promise.all(chains.map(([, data]) => (0, derive_address_1.deriveAddress)(mnemonic, data.prefix, data.hd_path)))).map((address, index) => [chains[index][0], chains[index][1], address]);
}
exports.getAddresses = getAddresses;
async function run(options) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const addresses = (await getAddresses(registry.chains, options.mnemonic))
        .map(([chain, , address]) => `${chain}: ${address}`)
        .join(os_1.default.EOL);
    console.log(addresses);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5cy1saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMva2V5cy1saXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsK0NBQStDO0FBRy9DLCtEQUEyRDtBQUMzRCw2RUFBdUU7QUFDdkUsdUZBQWlGO0FBQ2pGLHdGQUFtRjtBQUNuRixnR0FBMEY7QUFDMUYsZ0dBQTJGO0FBY3BGLEtBQUssVUFBVSxRQUFRLENBQUMsS0FBWSxFQUFFLE9BQWU7SUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBQSx1Q0FBaUIsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFBLDBDQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUEsOENBQW9CLEVBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSwrQ0FBcUIsRUFBQztRQUMzQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVc7UUFDbEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxRQUFRO1FBQzVCLE9BQU87UUFDUCxHQUFHO0tBQ0osQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQVk7UUFDdkIsSUFBSTtRQUNKLFFBQVE7S0FDVCxDQUFDO0lBRUYsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckIsQ0FBQztBQWpCRCw0QkFpQkM7QUFFTSxLQUFLLFVBQVUsWUFBWSxDQUNoQyxjQUFxQyxFQUNyQyxRQUFnQjtJQUVoQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRTlDLE9BQU8sQ0FDTCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ2YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQ3RCLElBQUEsOEJBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQ25ELENBQ0YsQ0FDRixDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzNFLENBQUM7QUFiRCxvQ0FhQztBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsT0FBZ0I7SUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsd0JBQVksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUEsb0RBQXVCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUUzRCxNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQU0sWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3RFLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEFBQUQsRUFBRyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxLQUFLLEtBQUssT0FBTyxFQUFFLENBQUM7U0FDbkQsSUFBSSxDQUFDLFlBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVoQixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFURCxrQkFTQyJ9