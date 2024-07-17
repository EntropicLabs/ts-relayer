"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.connect = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const link_1 = require("../../../lib/link");
const constants_1 = require("../../constants");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_option_1 = require("../../utils/options/resolve-option");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
const signing_client_1 = require("../../utils/signing-client");
async function connect(flags, logger) {
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
    const srcTrust = (0, resolve_option_1.resolveOption)("srcTrust", { integer: true })(flags.srcTrust, process.env.RELAYER_SRC_TRUST);
    const destTrust = (0, resolve_option_1.resolveOption)("destTrust", { integer: true })(flags.destTrust, process.env.RELAYER_DEST_TRUST);
    const options = {
        home,
        mnemonic,
        src,
        dest,
        srcTrust,
        destTrust,
    };
    await run(options, app, logger);
}
exports.connect = connect;
async function run(options, app, logger) {
    const registryFilePath = path_1.default.join(options.home, constants_1.registryFile);
    const registry = (0, load_and_validate_registry_1.loadAndValidateRegistry)(registryFilePath);
    const srcChain = registry.chains[options.src];
    if (!srcChain) {
        throw new Error(`src channel  "${options.src}" not found in registry`);
    }
    const destChain = registry.chains[options.dest];
    if (!destChain) {
        throw new Error(`dest channel  "${options.dest}" not found in registry`);
    }
    const nodeA = await (0, signing_client_1.signingClient)(srcChain, options.mnemonic, logger);
    const nodeB = await (0, signing_client_1.signingClient)(destChain, options.mnemonic, logger);
    const link = await link_1.Link.createWithNewConnections(nodeA, nodeB, logger, options.srcTrust, options.destTrust);
    const appYaml = js_yaml_1.default.dump({
        ...app,
        srcConnection: link.endA.connectionID,
        destConnection: link.endB.connectionID,
    }, {
        lineWidth: 1000,
    });
    fs_1.default.writeFileSync(path_1.default.join(options.home, constants_1.appFile), appYaml, {
        encoding: "utf-8",
    });
    console.log(`Created connections ${link.endA.connectionID} (${link.endA.clientID}) <=> ${link.endB.connectionID} (${link.endB.clientID})`);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2Nvbm5lY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4QixzREFBMkI7QUFFM0IsNENBQXlDO0FBQ3pDLCtDQUF3RDtBQUd4RCw2RUFBdUU7QUFDdkUsdUZBQWlGO0FBQ2pGLHVFQUFtRTtBQUNuRSx3RkFBbUY7QUFDbkYsZ0dBQTBGO0FBQzFGLGdHQUEyRjtBQUMzRiwrREFBMkQ7QUFvQnBELEtBQUssVUFBVSxPQUFPLENBQUMsS0FBWSxFQUFFLE1BQWM7SUFDeEQsTUFBTSxJQUFJLEdBQUcsSUFBQSx1Q0FBaUIsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFBLDBDQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDUixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsbUJBQU8saUJBQWlCLElBQUksRUFBRSxDQUFDLENBQUM7S0FDcEQ7SUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFBLDhDQUFvQixFQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUMxRSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsK0NBQXFCLEVBQUM7UUFDM0MsZUFBZSxFQUFFLEtBQUssQ0FBQyxXQUFXO1FBQ2xDLFlBQVksRUFBRSxLQUFLLENBQUMsUUFBUTtRQUM1QixPQUFPO1FBQ1AsR0FBRztLQUNKLENBQUMsQ0FBQztJQUNILE1BQU0sR0FBRyxHQUFHLElBQUEsOEJBQWEsRUFBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FB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