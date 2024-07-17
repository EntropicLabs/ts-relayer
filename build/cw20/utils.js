"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPacketsFromB = exports.assertPacketsFromA = exports.assertAckErrors = exports.assertAckSuccess = exports.setupContracts = void 0;
const fs_1 = require("fs");
const encoding_1 = require("@cosmjs/encoding");
const __1 = require("..");
const { setupWasmClient } = __1.testutils;
async function setupContracts(contracts) {
    const cosmwasm = await setupWasmClient();
    const results = {};
    for (const name in contracts) {
        const path = `./src/testdata/${contracts[name]}`;
        console.info(`Storing ${name} from ${path}...`);
        const wasm = await (0, fs_1.readFileSync)(path);
        const receipt = await cosmwasm.sign.upload(cosmwasm.senderAddress, wasm, "auto", `Upload ${name}`);
        console.debug(`Upload ${name} with CodeID: ${receipt.codeId}`);
        results[name] = receipt.codeId;
    }
    return results;
}
exports.setupContracts = setupContracts;
// throws error if not all are success
function assertAckSuccess(acks) {
    for (const ack of acks) {
        const parsed = JSON.parse((0, encoding_1.fromUtf8)(ack.acknowledgement));
        if (parsed.error) {
            throw new Error(`Unexpected error in ack: ${parsed.error}`);
        }
        if (!parsed.result) {
            throw new Error(`Ack result unexpectedly empty`);
        }
    }
}
exports.assertAckSuccess = assertAckSuccess;
// throws error if not all are errors
function assertAckErrors(acks) {
    for (const ack of acks) {
        const parsed = JSON.parse((0, encoding_1.fromUtf8)(ack.acknowledgement));
        if (parsed.result) {
            throw new Error(`Ack result unexpectedly set`);
        }
        if (!parsed.error) {
            throw new Error(`Ack error unexpectedly empty`);
        }
    }
}
exports.assertAckErrors = assertAckErrors;
function assertPacketsFromA(relay, count, success) {
    if (relay.packetsFromA !== count) {
        throw new Error(`Expected ${count} packets, got ${relay.packetsFromA}`);
    }
    if (relay.acksFromB.length !== count) {
        throw new Error(`Expected ${count} acks, got ${relay.acksFromB.length}`);
    }
    if (success) {
        assertAckSuccess(relay.acksFromB);
    }
    else {
        assertAckErrors(relay.acksFromB);
    }
}
exports.assertPacketsFromA = assertPacketsFromA;
function assertPacketsFromB(relay, count, success) {
    if (relay.packetsFromB !== count) {
        throw new Error(`Expected ${count} packets, got ${relay.packetsFromB}`);
    }
    if (relay.acksFromA.length !== count) {
        throw new Error(`Expected ${count} acks, got ${relay.acksFromA.length}`);
    }
    if (success) {
        assertAckSuccess(relay.acksFromA);
    }
    else {
        assertAckErrors(relay.acksFromA);
    }
}
exports.assertPacketsFromB = assertPacketsFromB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY3cyMC91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQkFBa0M7QUFFbEMsK0NBQTRDO0FBRTVDLDBCQUEyRDtBQUMzRCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsYUFBUyxDQUFDO0FBRS9CLEtBQUssVUFBVSxjQUFjLENBQ2xDLFNBQWlDO0lBRWpDLE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBZSxFQUFFLENBQUM7SUFFekMsTUFBTSxPQUFPLEdBQTJCLEVBQUUsQ0FBQztJQUUzQyxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsRUFBRTtRQUM1QixNQUFNLElBQUksR0FBRyxrQkFBa0IsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDakQsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxpQkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQ3hDLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLElBQUksRUFDSixNQUFNLEVBQ04sVUFBVSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUNGLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLGlCQUFpQixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUMvRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztLQUNoQztJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUF0QkQsd0NBc0JDO0FBRUQsc0NBQXNDO0FBQ3RDLFNBQWdCLGdCQUFnQixDQUFDLElBQXVCO0lBQ3RELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1FBQ3RCLE1BQU0sTUFBTSxH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