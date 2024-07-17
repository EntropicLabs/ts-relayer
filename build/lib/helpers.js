"use strict";
// This file outputs some basic test functionality, and includes tests that they work
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferTokens = exports.randomAddress = exports.generateMnemonic = exports.fundAccount = exports.setupWasmClient = exports.setup = exports.setupGaiaWasm = exports.signingCosmWasmClient = exports.signingClient = exports.queryClient = exports.ics20 = exports.osmosis = exports.wasmd = exports.gaia = exports.TestLogger = void 0;
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const channel_1 = require("cosmjs-types/ibc/core/channel/v1/channel");
const sinon_1 = __importDefault(require("sinon"));
const ibcclient_1 = require("./ibcclient");
class TestLogger {
    constructor(shouldLog = false) {
        const createSpy = (logFn) => sinon_1.default.spy(((message, meta) => {
            logFn(message, meta ? JSON.stringify(meta) : undefined);
            return this;
        }).bind(this));
        const createFake = (() => sinon_1.default.fake.returns(this)).bind(this);
        this.error = shouldLog ? createSpy(console.error) : createFake();
        this.warn = shouldLog ? createSpy(console.warn) : createFake();
        this.info = shouldLog ? createSpy(console.info) : createFake();
        this.verbose = shouldLog ? createSpy(console.log) : createFake();
        this.debug = createFake();
        this.child = () => this;
    }
}
exports.TestLogger = TestLogger;
exports.gaia = {
    tendermintUrlWs: "ws://localhost:26655",
    tendermintUrlHttp: "http://localhost:26655",
    chainId: "gaia-test",
    prefix: "cosmos",
    denomStaking: "uatom",
    denomFee: "uatom",
    minFee: "0.025uatom",
    blockTime: 250,
    faucet: {
        mnemonic: "economy stock theory fatal elder harbor betray wasp final emotion task crumble siren bottom lizard educate guess current outdoor pair theory focus wife stone",
        pubkey0: {
            type: "tendermint/PubKeySecp256k1",
            value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
        },
        address0: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
    },
    ics20Port: "custom",
    estimatedBlockTime: 400,
    estimatedIndexerTime: 80,
};
exports.wasmd = {
    tendermintUrlWs: "ws://localhost:26659",
    tendermintUrlHttp: "http://localhost:26659",
    chainId: "testing",
    prefix: "wasm",
    denomStaking: "ustake",
    denomFee: "ucosm",
    minFee: "0.025ucosm",
    blockTime: 250,
    faucet: {
        mnemonic: "enlist hip relief stomach skate base shallow young switch frequent cry park",
        pubkey0: {
            type: "tendermint/PubKeySecp256k1",
            value: "A9cXhWb8ZpqCzkA8dQCPV29KdeRLV3rUYxrkHudLbQtS",
        },
        address0: "wasm14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk",
    },
    ics20Port: "transfer",
    estimatedBlockTime: 400,
    estimatedIndexerTime: 80,
};
exports.osmosis = {
    tendermintUrlWs: "ws://localhost:26653",
    tendermintUrlHttp: "http://localhost:26653",
    chainId: "osmo-testing",
    prefix: "osmo",
    denomStaking: "uosmo",
    denomFee: "uosmo",
    minFee: "0uosmo",
    blockTime: 250,
    faucet: {
        mnemonic: "remain fragile remove stamp quiz bus country dress critic mammal office need",
        pubkey0: {
            type: "tendermint/PubKeySecp256k1",
            value: "A0d/GxY+UALE+miWJP0qyq4/EayG1G6tsg24v+cbD6By",
        },
        address0: "osmo1lvrwcvrqlc5ktzp2c4t22xgkx29q3y83hdcc5d",
    },
    ics20Port: "transfer",
    estimatedBlockTime: 400,
    estimatedIndexerTime: 80,
};
// constants for this transport protocol
// look at ChainDefinitions to find standard ics20 port
exports.ics20 = {
    version: "ics20-1",
    ordering: channel_1.Order.ORDER_UNORDERED,
};
async function queryClient(opts) {
    return stargate_1.StargateClient.connect(opts.tendermintUrlHttp);
}
exports.queryClient = queryClient;
function extras() {
    const extras = process.env.NODE_ENV == "test"
        ? {
            // This is just for tests - don't add this in production code
            broadcastPollIntervalMs: 300,
            broadcastTimeoutMs: 2000,
        }
        : {};
    return extras;
}
async function signingClient(opts, mnemonic, logger) {
    const signer = await proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: opts.prefix,
    });
    const { address } = (await signer.getAccounts())[0];
    const options = {
        gasPrice: stargate_1.GasPrice.fromString(opts.minFee),
        logger,
        estimatedBlockTime: opts.estimatedBlockTime,
        estimatedIndexerTime: opts.estimatedIndexerTime,
        ...extras(),
    };
    const client = await ibcclient_1.IbcClient.connectWithSigner(opts.tendermintUrlHttp, signer, address, options);
    return client;
}
exports.signingClient = signingClient;
async function signingCosmWasmClient(opts, mnemonic) {
    const wallet = await proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: opts.prefix,
    });
    const { address: senderAddress } = (await wallet.getAccounts())[0];
    const options = {
        gasPrice: stargate_1.GasPrice.fromString(opts.minFee),
        ...extras(),
    };
    const sign = await cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(opts.tendermintUrlHttp, wallet, options);
    return { sign, senderAddress };
}
exports.signingCosmWasmClient = signingCosmWasmClient;
async function setupGaiaWasm(logger) {
    return setup(exports.gaia, exports.wasmd, logger);
}
exports.setupGaiaWasm = setupGaiaWasm;
async function setup(srcConfig, destConfig, logger) {
    // create apps and fund an account
    const mnemonic = generateMnemonic();
    const src = await signingClient(srcConfig, mnemonic, logger);
    const dest = await signingClient(destConfig, mnemonic, logger);
    await fundAccount(destConfig, dest.senderAddress, "4000000");
    await fundAccount(srcConfig, src.senderAddress, "4000000");
    return [src, dest];
}
exports.setup = setup;
// This creates a client for the CosmWasm chain, that can interact with contracts
async function setupWasmClient() {
    // create apps and fund an account
    const mnemonic = generateMnemonic();
    const cosmwasm = await signingCosmWasmClient(exports.wasmd, mnemonic);
    await fundAccount(exports.wasmd, cosmwasm.senderAddress, "4000000");
    return cosmwasm;
}
exports.setupWasmClient = setupWasmClient;
async function fundAccount(opts, rcpt, amount) {
    const client = await signingClient(opts, opts.faucet.mnemonic);
    const feeTokens = {
        amount,
        denom: stargate_1.GasPrice.fromString(opts.minFee).denom,
    };
    await client.sendTokens(rcpt, [feeTokens]);
}
exports.fundAccount = fundAccount;
function generateMnemonic() {
    return crypto_1.Bip39.encode(crypto_1.Random.getBytes(16)).toString();
}
exports.generateMnemonic = generateMnemonic;
function randomAddress(prefix) {
    const random = crypto_1.Random.getBytes(20);
    return (0, encoding_1.toBech32)(prefix, random);
}
exports.randomAddress = randomAddress;
// Makes multiple transfers, one per item in amounts.
// Return a list of the block heights the packets were committed in.
async function transferTokens(src, srcDenom, dest, destPrefix, channel, amounts, timeout) {
    const txHeights = [];
    const destRcpt = randomAddress(destPrefix);
    const destHeight = await dest.timeoutHeight(timeout ?? 500); // valid for 500 blocks or timeout if specified
    for (const amount of amounts) {
        const token = {
            amount: amount.toString(),
            denom: srcDenom,
        };
        const { height } = await src.transferTokens(channel.portId, channel.channelId, token, destRcpt, destHeight);
        txHeights.push(height);
    }
    return txHeights;
}
exports.transferTokens = transferTokens;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUZBQXFGOzs7Ozs7QUFFckYsaUVBR21DO0FBQ25DLDJDQUErQztBQUMvQywrQ0FBNEM7QUFDNUMseURBQWdFO0FBQ2hFLCtDQUE0RDtBQUM1RCxzRUFBaUU7QUFDakUsa0RBQXdDO0FBRXhDLDJDQUF1RTtBQUd2RSxNQUFhLFVBQVU7SUFRckIsWUFBWSxTQUFTLEdBQUcsS0FBSztRQUMzQixNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQWtELEVBQUUsRUFBRSxDQUN2RSxlQUFLLENBQUMsR0FBRyxDQUNQLENBQUMsQ0FBQyxPQUFlLEVBQUUsSUFBOEIsRUFBVSxFQUFFO1lBQzNELEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4RCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDZCxDQUFDO1FBQ0osTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvRCxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQy9ELElBQUksQ0FBQyxJ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