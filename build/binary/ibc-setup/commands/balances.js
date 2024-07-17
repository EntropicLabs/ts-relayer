"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.balances = void 0;
const path_1 = __importDefault(require("path"));
const stargate_1 = require("@cosmjs/stargate");
const constants_1 = require("../../constants");
const borderless_table_1 = require("../../utils/borderless-table");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
const signing_client_1 = require("../../utils/signing-client");
const keys_list_1 = require("./keys-list");
async function balances(flags, logger) {
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
    await run(options, logger);
}
exports.balances = balances;
async function run(options, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const addresses = await (0, keys_list_1.getAddresses)(registry.chains, options.mnemonic);
    const balances = (await Promise.allSettled(addresses.map(async ([chain, data, address]) => {
        const client = await (0, signing_client_1.signingClient)(data, options.mnemonic, logger.child({ label: chain }));
        const gasPrice = stargate_1.GasPrice.fromString(data.gas_price);
        const coin = await client.query.bank.balance(address, gasPrice.denom);
        return [chain, coin];
    })))
        .filter((result) => {
        if (result.status === "rejected") {
            logger.error(result.reason);
            return false;
        }
        return true;
    })
        .map((result) => result.value)
        .filter(([, coin]) => coin.amount !== "0")
        .map(([chain, coin]) => [chain, `${coin.amount}${coin.denom}`]);
    if (!balances.length) {
        console.log("No funds found for default denomination on any chain.");
        return;
    }
    console.log((0, borderless_table_1.borderlessTable)([["CHAIN", "AMOUNT"], ...balances]));
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFsYW5jZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9jb21tYW5kcy9iYWxhbmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBd0I7QUFFeEIsK0NBQTRDO0FBRzVDLCtDQUErQztBQUUvQyxtRUFBK0Q7QUFDL0QsNkVBQXVFO0FBQ3ZFLHVGQUFpRjtBQUNqRix3RkFBbUY7QUFDbkYsZ0dBQTBGO0FBQzFGLGdHQUEyRjtBQUMzRiwrREFBMkQ7QUFFM0QsMkNBQTJEO0FBRXBELEtBQUssVUFBVSxRQUFRLENBQUMsS0FBWSxFQUFFLE1BQWM7SUFDekQsTUFBTSxJQUFJLEdBQUcsSUFBQSx1Q0FBaUIsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFBLDBDQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUEsOENBQW9CLEVBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSwrQ0FBcUIsRUFBQztRQUMzQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVc7UUFDbEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxRQUFRO1FBQzVCLE9BQU87UUFDUCxHQUFHO0tBQ0osQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQVk7UUFDdkIsSUFBSTtRQUNKLFFBQVE7S0FDVCxDQUFDO0lBRUYsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFqQkQsNEJBaUJDO0FBRU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxPQUFnQixFQUFFLE1BQWM7SUFDeEQsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsd0JBQVksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sUUFBUSxHQUFHLElBQUEsb0RBQXVCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUUzRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsd0JBQVksRUFBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV4RSxNQUFNLFFBQVEsR0FBRyxDQUNmLE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FDdEIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUU7UUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDhCQUFhLEVBQ2hDLElBQUksRUFDSixPQUFPLENBQUMsUUFBUSxFQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQy9CLENBQUM7UUFDRixNQUFNLFFBQVEsR0FBRyxtQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RSxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUNILENBQ0Y7U0FDRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQW9ELEVBQUU7UUFDbkUsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFVBQVUsRUFBRTtZQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7U0FDRCxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQztTQUN6QyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFbEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7UUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQ3JFLE9BQU87S0FDUjtJQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBQSxrQ0FBZSxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQztBQXRDRCxrQkFzQ0MifQ==