"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveAddress = void 0;
const crypto_1 = require("@cosmjs/crypto");
const proto_signing_1 = require("@cosmjs/proto-signing");
async function deriveAddress(mnemomic, prefix, hdPath) {
    const hdPathsToSpread = hdPath ? { hdPaths: [(0, crypto_1.stringToPath)(hdPath)] } : {};
    const wallet = await proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemomic, {
        prefix,
        ...hdPathsToSpread,
    });
    const accounts = await wallet.getAccounts();
    return accounts[0].address;
}
exports.deriveAddress = deriveAddress;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVyaXZlLWFkZHJlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL2Rlcml2ZS1hZGRyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUE4QztBQUM5Qyx5REFBZ0U7QUFFekQsS0FBSyxVQUFVLGFBQWEsQ0FDakMsUUFBZ0IsRUFDaEIsTUFBYyxFQUNkLE1BQWU7SUFFZixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsSUFBQSxxQkFBWSxFQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzFFLE1BQU0sTUFBTSxHQUFHLE1BQU0sdUNBQXVCLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtRQUNsRSxNQUFNO1FBQ04sR0FBRyxlQUFlO0tBQ25CLENBQUMsQ0FBQztJQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzVDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUM3QixDQUFDO0FBWkQsc0NBWUMifQ==