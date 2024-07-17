"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file outputs some basic test functionality, and includes tests that they work
const ava_1 = __importDefault(require("ava"));
const helpers_1 = require("./helpers");
ava_1.default.serial("funds account and checks balance", async (t) => {
    const logger = new helpers_1.TestLogger();
    // create apps and fund an account
    const mnemonic = (0, helpers_1.generateMnemonic)();
    const src = await (0, helpers_1.signingClient)(helpers_1.osmosis, mnemonic, logger);
    await (0, helpers_1.fundAccount)(helpers_1.osmosis, src.senderAddress, "600000");
    const balance = await src.query.bank.allBalances(src.senderAddress);
    t.deepEqual(balance, [{ amount: "600000", denom: "uosmo" }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Ntb3Npcy5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9vc21vc2lzLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRkFBcUY7QUFDckYsOENBQXVCO0FBRXZCLHVDQU1tQjtBQUVuQixhQUFJLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFVLEVBQUUsQ0FBQztJQUNoQyxrQ0FBa0M7SUFDbEMsTUFBTSxRQUFRLEdBQUcsSUFBQSwwQkFBZ0IsR0FBRSxDQUFDO0lBQ3BDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLGlCQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNELE1BQU0sSUFBQSxxQkFBVyxFQUFDLGlCQUFPLEVBQUUsR0FBRyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV4RCxNQUFNLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyJ9