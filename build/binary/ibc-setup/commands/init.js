"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.init = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const faucet_client_1 = require("@cosmjs/faucet-client");
const axios_1 = __importDefault(require("axios"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const constants_1 = require("../../constants");
const types_1 = require("../../types");
const derive_address_1 = require("../../utils/derive-address");
const generate_mnemonic_1 = require("../../utils/generate-mnemonic");
const is_no_exist_error_1 = require("../../utils/is-no-exist-error");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_option_1 = require("../../utils/options/resolve-option");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
function copyRegistryFile(from, to) {
    try {
        fs_1.default.copyFileSync(from, to);
        console.log(`Copied existing registry from ${from} to ${to}.`);
    }
    catch (error) {
        if ((0, is_no_exist_error_1.isNoExistError)(error)) {
            throw new Error(`No such file: ${from}. Make sure that "--registry-from" points at existing relayer's home dir.`);
        }
        else {
            throw error;
        }
    }
}
async function pullRegistryFromRemote(writeTo) {
    try {
        const registryFromRemote = await axios_1.default.get("https://raw.githubusercontent.com/confio/ts-relayer/main/demo/registry.yaml");
        fs_1.default.writeFileSync(writeTo, registryFromRemote.data);
        console.log(`Pulled default ${constants_1.registryFile} from remote.`);
    }
    catch (error) {
        throw new Error(`Cannot fetch ${constants_1.registryFile} from remote. ${error}`);
    }
}
async function init(flags, _logger) {
    const options = {
        src: (0, resolve_option_1.resolveOption)("src")(flags.src, process.env.RELAYER_SRC),
        dest: (0, resolve_option_1.resolveOption)("dest")(flags.dest, process.env.RELAYER_DEST),
        home: (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home }),
        registryFrom: (0, resolve_option_1.resolveOption)("registryFrom")(flags.registryFrom, process.env.RELAYER_REGISTRY_FROM),
    };
    await run(options);
}
exports.init = init;
async function run(options) {
    const appFilePath = path_1.default.join(options.home, constants_1.appFile);
    if (fs_1.default.existsSync(appFilePath)) {
        console.log(`The ${constants_1.appFile} is already initialized at ${options.home}.`);
        return;
    }
    if (!fs_1.default.existsSync(options.home)) {
        fs_1.default.mkdirSync(options.home, { recursive: true });
        console.log(`Initialized home directory at ${options.home}`);
    }
    else if (!fs_1.default.lstatSync(options.home).isDirectory()) {
        throw new Error(`${options.home} must be a directory.`);
    }
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    if (!fs_1.default.existsSync(registryFilePath)) {
        if (options.registryFrom) {
            copyRegistryFile(path_1.default.join(options.registryFrom, constants_1.registryFile), registryFilePath);
        }
        else {
            await pullRegistryFromRemote(registryFilePath);
        }
    }
    else if (!fs_1.default.lstatSync(registryFilePath).isFile()) {
        throw new Error(`${registryFilePath} must be a file.`);
    }
    if (!options.src || !options.dest) {
        console.log(`Exited early. Registry file downloaded to ${registryFilePath}. Please edit that file and add any chains you wish. Then complete the initialization by running ibc-setup init --src <chain-1> --dest <chain-2>.`);
        return;
    }
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const [chainSrc, chainDest] = [options.src, options.dest].map((chain) => {
        const chainData = registry.chains[chain];
        if (!chainData) {
            throw new Error(`Chain ${chain} is missing in the registry, either check the spelling or add the chain definition to ${registryFilePath}.`);
        }
        return chainData;
    });
    const mnemonic = (0, generate_mnemonic_1.generateMnemonic)();
    const appYaml = js_yaml_1.default.dump({
        src: options.src,
        dest: options.dest,
        mnemonic,
    }, {
        lineWidth: 1000, // to ensure mnemonic is not split on multiple lines
    });
    fs_1.default.writeFileSync(appFilePath, appYaml, { encoding: "utf-8" });
    console.log(`Saved configuration to ${appFilePath}`);
    const [addressSrc, addressDest] = await Promise.all([
        (0, derive_address_1.deriveAddress)(mnemonic, chainSrc.prefix, chainSrc.hd_path),
        (0, derive_address_1.deriveAddress)(mnemonic, chainDest.prefix, chainDest.hd_path),
    ]);
    console.log(`Source address: ${addressSrc}`);
    console.log(`Destination address: ${addressDest}`);
    // if there are faucets, ask for tokens
    if (chainSrc.faucet) {
        const srcDenom = (0, types_1.feeDenom)(chainSrc);
        console.log(`Requesting ${srcDenom} for ${chainSrc.chain_id}...`);
        await new faucet_client_1.FaucetClient(chainSrc.faucet).credit(addressSrc, srcDenom);
    }
    if (chainDest.faucet) {
        const destDenom = (0, types_1.feeDenom)(chainDest);
        console.log(`Requesting ${destDenom} for ${chainDest.chain_id}...`);
        await new faucet_client_1.FaucetClient(chainDest.faucet).credit(addressDest, destDenom);
    }
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4Qix5REFBcUQ7QUFDckQsa0RBQTBCO0FBQzFCLHNEQUEyQjtBQUUzQiwrQ0FBd0Q7QUFFeEQsdUNBQXVDO0FBQ3ZDLCtEQUEyRDtBQUMzRCxxRUFBaUU7QUFDakUscUVBQStEO0FBQy9ELHVGQUFpRjtBQUNqRix1RUFBbUU7QUFDbkUsd0ZBQW1GO0FBZ0JuRixTQUFTLGdCQUFnQixDQUFDLElBQVksRUFBRSxFQUFVO0lBQ2hELElBQUk7UUFDRixZQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxJQUFJLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNoRTtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBSSxJQUFBLGtDQUFjLEVBQUMsS0FBSyxDQUFDLEVBQUU7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FDYixpQkFBaUIsSUFBSSwyRUFBMkUsQ0FDakcsQ0FBQztTQUNIO2FBQU07WUFDTCxNQUFNLEtBQUssQ0FBQztTQUNiO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLHNCQUFzQixDQUFDLE9BQWU7SUFDbkQsSUFBSTtRQUNGLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxlQUFLLENBQUMsR0FBRyxDQUN4Qyw2RUFBNkUsQ0FDOUUsQ0FBQztRQUNGLFlBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLHdCQUFZLGVBQWUsQ0FBQyxDQUFDO0tBQzVEO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxN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