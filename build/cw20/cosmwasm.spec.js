"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@cosmjs/utils");
const ava_1 = __importDefault(require("ava"));
const __1 = require("..");
const { gaia, ics20, setup, setupWasmClient, wasmd } = __1.testutils;
// TODO: replace these with be auto-generated helpers from ts-codegen
const cw20_1 = require("./cw20");
const utils_2 = require("./utils");
let codeIds = {};
ava_1.default.before(async (t) => {
    const contracts = {
        cw20: "cw20_base.wasm",
        ics20: "cw20_ics20.wasm",
    };
    codeIds = await (0, utils_2.setupContracts)(contracts);
    t.pass();
});
ava_1.default.serial("set up channel with ics20 contract", async (t) => {
    const cosmwasm = await setupWasmClient();
    // instantiate ics20
    const ics20Msg = {
        default_timeout: 3600,
        gov_contract: cosmwasm.senderAddress,
        allowlist: [],
    };
    const { contractAddress: ics20Addr } = await cosmwasm.sign.instantiate(cosmwasm.senderAddress, codeIds.ics20, ics20Msg, "ICS", "auto");
    t.truthy(ics20Addr);
    const { ibcPortId: wasmPort } = await cosmwasm.sign.getContract(ics20Addr);
    console.log(`Ibc Port: ${wasmPort}`);
    (0, utils_1.assert)(wasmPort);
    const [src, dest] = await setup(gaia, wasmd);
    const link = await __1.Link.createWithNewConnections(src, dest);
    await link.createChannel("A", gaia.ics20Port, wasmPort, ics20.ordering, ics20.version);
});
ava_1.default.serial("send packets with ics20 contract", async (t) => {
    const cosmwasm = await setupWasmClient();
    // instantiate cw20
    const initMsg = (0, cw20_1.init)(cosmwasm.senderAddress, "CASH", "123456789000");
    const { contractAddress: cw20Addr } = await cosmwasm.sign.instantiate(cosmwasm.senderAddress, codeIds.cw20, initMsg, "CASH", "auto");
    t.truthy(cw20Addr);
    let bal = await (0, cw20_1.balance)(cosmwasm, cw20Addr);
    t.is("123456789000", bal);
    // instantiate ics20
    const ics20Msg = {
        default_timeout: 3600,
        gov_contract: cosmwasm.senderAddress,
        allowlist: [
            {
                contract: cw20Addr,
                gas_limit: 250000,
            },
        ],
    };
    const { contractAddress: ics20Addr } = await cosmwasm.sign.instantiate(cosmwasm.senderAddress, codeIds.ics20, ics20Msg, "ICSX", "auto");
    t.truthy(ics20Addr);
    const { ibcPortId: wasmPort } = await cosmwasm.sign.getContract(ics20Addr);
    console.log(`Ibc Port: ${wasmPort}`);
    (0, utils_1.assert)(wasmPort);
    const [src, dest] = await setup(gaia, wasmd);
    const link = await __1.Link.createWithNewConnections(src, dest);
    const channels = await link.createChannel("A", gaia.ics20Port, wasmPort, ics20.ordering, ics20.version);
    // send cw20 tokens to ics20 contract and create a new packet
    // (dest chain is wasmd)
    const sendMsg = (0, cw20_1.sendTokens)(ics20Addr, "456789000", {
        channel: channels.dest.channelId,
        remote_address: src.senderAddress,
    });
    await cosmwasm.sign.execute(cosmwasm.senderAddress, cw20Addr, sendMsg, "auto", "Send CW20 tokens via ICS20");
    // let's see if the balance went down
    bal = await (0, cw20_1.balance)(cosmwasm, cw20Addr);
    t.is("123000000000", bal);
    // check source balance
    const preBalance = await src.sign.getAllBalances(src.senderAddress);
    t.is(1, preBalance.length);
    t.is("uatom", preBalance[0].denom);
    // easy way to move all packets and verify the results
    let info = await link.relayAll();
    (0, utils_2.assertPacketsFromB)(info, 1, true);
    // check source balances increased
    const relayedBalance = await src.sign.getAllBalances(src.senderAddress);
    t.is(2, relayedBalance.length);
    const ibcCoin = relayedBalance.find((d) => d.denom !== "uatom");
    (0, utils_1.assert)(ibcCoin);
    t.is("456789000", ibcCoin.amount);
    console.log(ibcCoin);
    // send this token back over the channel
    const timeoutHeight = await dest.timeoutHeight(500);
    await src.transferTokens(channels.src.portId, channels.src.channelId, ibcCoin, dest.senderAddress, timeoutHeight);
    await src.waitOneBlock();
    // easy way to move all packets
    info = await link.relayAll();
    (0, utils_2.assertPacketsFromA)(info, 1, true);
    // extra check just because... not really needed
    (0, utils_2.assertPacketsFromB)(info, 0, true);
    // balance updated on recipient
    const gotBal = await (0, cw20_1.balance)(cosmwasm, cw20Addr, dest.senderAddress);
    t.is(gotBal, "456789000");
    // send native token over channel (from dest -> cosmwasm chain)
    const timeoutHeight2 = await dest.timeoutHeight(500);
    const nativeCoin = {
        denom: "uatom",
        amount: "111111",
    };
    await src.transferTokens(channels.src.portId, channels.src.channelId, nativeCoin, dest.senderAddress, timeoutHeight2);
    await src.waitOneBlock();
    // relay and verify this fails (as it should)
    info = await link.relayAll();
    (0, utils_2.assertPacketsFromA)(info, 1, false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29zbXdhc20uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jdzIwL2Nvc213YXNtLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5Q0FBdUM7QUFDdkMsOENBQXVCO0FBRXZCLDBCQUFxQztBQUNyQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxHQUFHLGFBQVMsQ0FBQztBQUVqRSxxRUFBcUU7QUFDckUsaUNBQW1EO0FBQ25ELG1DQUlpQjtBQUVqQixJQUFJLE9BQU8sR0FBMkIsRUFBRSxDQUFDO0FBRXpDLGFBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3RCLE1BQU0sU0FBUyxHQUFHO1FBQ2hCLElBQUksRUFBRSxnQkFBZ0I7UUFDdEIsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QixDQUFDO0lBQ0YsT0FBTyxHQUFHLE1BQU0sSUFBQSxzQkFBYyxFQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDO0FBRUgsYUFBSSxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDNUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztJQUV6QyxvQkFBb0I7SUFDcEIsTUFBTSxRQUFRLEdBQUc7UUFDZixlQUFlLEVBQUUsSUFBSTtRQUNyQixZQUFZLEVBQUUsUUFBUSxDQUFDLGFBQWE7UUFDcEMsU0FBUyxFQUFFLEVBQUU7S0FDZCxDQUFDO0lBQ0YsTUFBTSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUNwRSxRQUFRLENBQUMsYUFBYSxFQUN0QixPQUFPLENBQUMsS0FBSyxFQUNiLFFBQVEsRUFDUixLQUFL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