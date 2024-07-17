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
    const src = await (0, helpers_1.signingClient)(helpers_1.gaia, mnemonic, logger);
    await (0, helpers_1.fundAccount)(helpers_1.gaia, src.senderAddress, "600000");
    const balance = await src.query.bank.allBalances(src.senderAddress);
    t.deepEqual(balance, [{ amount: "600000", denom: "uatom" }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FpYS5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9nYWlhLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRkFBcUY7QUFDckYsOENBQXVCO0FBRXZCLHVDQU1tQjtBQUVuQixhQUFJLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFVLEVBQUUsQ0FBQztJQUNoQyxrQ0FBa0M7SUFDbEMsTUFBTSxRQUFRLEdBQUcsSUFBQSwwQkFBZ0IsR0FBRSxDQUFDO0lBQ3BDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLGNBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDeEQsTUFBTSxJQUFBLHFCQUFXLEVBQUMsY0FBSSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFckQsTUFBTSxPQUFPLEdBQUcsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3BFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0QsQ0FBQyxDQUFDLENBQUMifQ==