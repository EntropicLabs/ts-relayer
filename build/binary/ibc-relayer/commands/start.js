"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.defaults = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@cosmjs/utils");
const link_1 = require("../../../lib/link");
const constants_1 = require("../../constants");
const InvalidOptionError_1 = require("../../exceptions/InvalidOptionError");
const load_and_validate_app_1 = require("../../utils/load-and-validate-app");
const load_and_validate_registry_1 = require("../../utils/load-and-validate-registry");
const resolve_option_1 = require("../../utils/options/resolve-option");
const resolve_home_option_1 = require("../../utils/options/shared/resolve-home-option");
const resolve_key_file_option_1 = require("../../utils/options/shared/resolve-key-file-option");
const resolve_mnemonic_option_1 = require("../../utils/options/shared/resolve-mnemonic-option");
const signing_client_1 = require("../../utils/signing-client");
const setup_prometheus_1 = require("../setup-prometheus");
function resolveHeights({ scanFromSrc, scanFromDest, home }, logger) {
    if (!scanFromSrc && scanFromDest) {
        throw new InvalidOptionError_1.InvalidOptionError(`You have defined "scanFromDest" but no "scanFromSrc". Both or none "scanFromSrc" and "scanFromDest" must be present.`);
    }
    if (scanFromSrc && !scanFromDest) {
        throw new InvalidOptionError_1.InvalidOptionError(`You have defined "scanFromSrc" but no "scanFromDest". Both or none "scanFromSrc" and "scanFromDest" must be present.`);
    }
    if (scanFromSrc && scanFromDest) {
        logger.info("Use heights from the command line arguments.");
        return {
            packetHeightA: scanFromSrc,
            ackHeightA: scanFromSrc,
            packetHeightB: scanFromDest,
            ackHeightB: scanFromDest,
        };
    }
    const lastQueriedHeightsFilePath = path_1.default.join(home, constants_1.lastQueriedHeightsFile);
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const heights = require(lastQueriedHeightsFilePath);
        logger.info(`Use last queried heights from ${lastQueriedHeightsFilePath} file.`);
        return heights;
    }
    catch {
        logger.info("Scanning the entire history for packets... This may take some time.");
    }
    return null;
}
exports.defaults = {
    // check once per minute
    poll: 60,
    // once per day: 86400s
    maxAgeSrc: 86400,
    maxAgeDest: 86400,
    metricsPort: 8080,
};
async function start(flags, logger) {
    const home = (0, resolve_home_option_1.resolveHomeOption)({ homeFlag: flags.home });
    const app = (0, load_and_validate_app_1.loadAndValidateApp)(home);
    const keyFile = (0, resolve_key_file_option_1.resolveKeyFileOption)({ keyFileFlag: flags.keyFile, app });
    const mnemonic = await (0, resolve_mnemonic_option_1.resolveMnemonicOption)({
        interactiveFlag: flags.interactive,
        keyFile,
        app,
    });
    const src = (0, resolve_option_1.resolveOption)("src", { required: true })(flags.src, app?.src, process.env.RELAYER_SRC);
    const dest = (0, resolve_option_1.resolveOption)("dest", { required: true })(flags.dest, app?.dest, process.env.RELAYER_DEST);
    const srcConnection = (0, resolve_option_1.resolveOption)("srcConnection", { required: true })(flags.srcConnection, app?.srcConnection, process.env.RELAYER_SRC_CONNECTION);
    const destConnection = (0, resolve_option_1.resolveOption)("destConnection", { required: true })(flags.destConnection, app?.destConnection, process.env.RELAYER_DEST_CONNECTION);
    // TODO: add this in app.yaml, process.env
    const poll = (0, resolve_option_1.resolveOption)("poll", { required: true, integer: true })(flags.poll, exports.defaults.poll);
    const maxAgeSrc = (0, resolve_option_1.resolveOption)("maxAgeSrc", {
        required: true,
        integer: true,
    })(flags.maxAgeSrc, exports.defaults.maxAgeSrc);
    const maxAgeDest = (0, resolve_option_1.resolveOption)("maxAgeB", {
        required: true,
        integer: true,
    })(flags.maxAgeDest, exports.defaults.maxAgeDest);
    const scanFromSrc = (0, resolve_option_1.resolveOption)("scanFromSrc", { integer: true })(flags.scanFromSrc, process.env.RELAYER_SCAN_FROM_SRC);
    const scanFromDest = (0, resolve_option_1.resolveOption)("scanFromDest", { integer: true })(flags.scanFromDest, process.env.RELAYER_SCAN_FROM_DEST);
    const enableMetrics = flags.enableMetrics ||
        Boolean(process.env.RELAYER_ENABLE_METRICS) ||
        app?.enableMetrics ||
        false;
    const metricsPort = (0, resolve_option_1.resolveOption)("metricsPort", {
        integer: true,
        required: true,
    })(flags.metricsPort, process.env.RELAYER_METRICS_PORT, app?.metricsPort, exports.defaults.metricsPort);
    const heights = resolveHeights({ scanFromSrc, scanFromDest, home }, logger);
    // FIXME: any env variable for this?
    const once = flags.once;
    const options = {
        src,
        dest,
        home,
        mnemonic,
        srcConnection,
        destConnection,
        poll,
        maxAgeSrc,
        maxAgeDest,
        once,
        heights,
        enableMetrics,
        metricsPort,
    };
    await run(options, logger);
}
exports.start = start;
async function run(options, logger) {
    const metrics = (0, setup_prometheus_1.setupPrometheus)({
        enabled: options.enableMetrics,
        port: options.metricsPort,
        logger,
    });
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
    const nodeA = await (0, signing_client_1.signingClient)(srcChain, options.mnemonic, logger.child({ label: srcChain.chain_id }));
    const nodeB = await (0, signing_client_1.signingClient)(destChain, options.mnemonic, logger.child({ label: destChain.chain_id }));
    const link = await link_1.Link.createWithExistingConnections(nodeA, nodeB, options.srcConnection, options.destConnection, logger);
    await relayerLoop(link, options, logger, metrics);
}
async function relayerLoop(link, options, logger, metrics) {
    let nextRelay = options.heights ?? {};
    const lastQueriedHeightsFilePath = path_1.default.join(options.home, constants_1.lastQueriedHeightsFile);
    const done = false;
    while (!done) {
        try {
            // TODO: make timeout windows more configurable
            nextRelay = await link.checkAndRelayPacketsAndAcks(nextRelay, 2, 6);
            fs_1.default.writeFileSync(lastQueriedHeightsFilePath, JSON.stringify(nextRelay, null, 2));
            // ensure the headers are up to date (only submits if old and we didn't just update them above)
            logger.info("Ensuring clients are not stale");
            await link.updateClientIfStale("A", options.maxAgeDest);
            await link.updateClientIfStale("B", options.maxAgeSrc);
        }
        catch (e) {
            logger.error(`Caught error: `, e);
        }
        if (options.once) {
            logger.info("Quitting after one run (--once set)");
            return;
        }
        // sleep until the next step
        logger.info(`Sleeping ${options.poll} seconds...`);
        await (0, utils_1.sleep)(options.poll * 1000);
        logger.info("... waking up and checking for packets!");
        metrics?.loopTotal?.inc();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1yZWxheWVyL2NvbW1hbmRzL3N0YXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIseUNBQXNDO0FBRXRDLDRDQUF5QztBQUV6QywrQ0FBdUU7QUFFdkUsNEVBQXlFO0FBRXpFLDZFQUF1RTtBQUN2RSx1RkFBaUY7QUFDakYsdUVBQW1FO0FBQ25FLHdGQUFtRjtBQUNuRixnR0FBMEY7QUFDMUYsZ0dBQTJGO0FBQzNGLCtEQUEyRDtBQUMzRCwwREFBK0Q7QUFRL0QsU0FBUyxjQUFjLENBQ3JCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQXdCLEVBQ3pELE1BQWM7SUFFZCxJQUFJLENBQUMsV0FBVyxJQUFJLFlBQVksRUFBRTtRQUNoQyxNQUFNLElBQUksdUNBQWtCLENBQzFCLHNIQUFzSCxDQUN2SCxDQUFDO0tBQ0g7SUFFRCxJQUFJLFdBQVcsSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNoQyxNQUFNLElBQUksdUNBQWtCLENBQzFCLHNIQUFzSCxDQUN2SCxDQUFDO0tBQ0g7SUFFRCxJQUFJLFdBQVcsSUFBSSxZQUFZLEVBQUU7UUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1FBQzVELE9BQU87WUFDTCxhQUFhLEVBQUUsV0FBVztZQUMxQixVQUFVLEVBQUUsV0FBVztZQUN2QixhQUFhLEVBQUUsWUFBWTtZQUMzQixVQUFVLEVBQUUsWUFBWTtTQUN6QixDQUFDO0tBQ0g7SUFFRCxNQUFNLDBCQUEwQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGtDQUFzQixDQUFDLENBQUM7SUFDM0UsSUFBSTtRQUNGLDhEQUE4RDtRQUM5RCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNwRCxNQUFN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