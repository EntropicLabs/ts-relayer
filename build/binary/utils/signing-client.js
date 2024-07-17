"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signingClient = void 0;
const crypto_1 = require("@cosmjs/crypto");
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const ibcclient_1 = require("../../lib/ibcclient");
async function signingClient(chain, mnemonic, logger) {
    const hdPathsToSpread = chain.hd_path
        ? { hdPaths: [(0, crypto_1.stringToPath)(chain.hd_path)] }
        : {};
    const signer = await proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: chain.prefix,
        ...hdPathsToSpread,
    });
    const { address } = (await signer.getAccounts())[0];
    // This is test timing to let us handle 250ms blocks without huge delays
    const extras = process.env.NODE_ENV == "test"
        ? {
            broadcastPollIntervalMs: 300,
            broadcastTimeoutMs: 2000,
        }
        : {};
    const options = {
        gasPrice: stargate_1.GasPrice.fromString(chain.gas_price),
        estimatedBlockTime: chain.estimated_block_time,
        estimatedIndexerTime: chain.estimated_indexer_time,
        logger,
        ...extras,
    };
    const client = await ibcclient_1.IbcClient.connectWithSigner(chain.rpc[0], signer, address, options);
    return client;
}
exports.signingClient = signingClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmluZy1jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL3NpZ25pbmctY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUE4QztBQUM5Qyx5REFBZ0U7QUFDaEUsK0NBQTRDO0FBRTVDLG1EQUFrRTtBQUkzRCxLQUFLLFVBQVUsYUFBYSxDQUNqQyxLQUFZLEVBQ1osUUFBZ0IsRUFDaEIsTUFBZTtJQUVmLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxPQUFPO1FBQ25DLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLElBQUEscUJBQVksRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtRQUM1QyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1AsTUFBTSxNQUFNLEdBQUcsTUFBTSx1Q0FBdUIsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1FBQ2xFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtRQUNwQixHQUFHLGVBQWU7S0FDbkIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRCx3RUFBd0U7SUFDeEUsTUFBTSxNQUFNLEdBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksTUFBTTtRQUM1QixDQUFDLENBQUM7WUFDRSx1QkFBdUIsRUFBRSxHQUFHO1lBQzVCLGtCQUFrQixFQUFFLElBQUk7U0FDekI7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1QsTUFBTSxPQUFPLEdBQXFCO1FBQ2hDLFFBQVEsRUFBRSxtQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQzlDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxvQkFBb0I7UUFDOUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLHNCQUFzQjtRQUNsRCxNQUFNO1FBQ04sR0FBRyxNQUFNO0tBQ1YsQ0FBQztJQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0scUJBQVMsQ0FBQyxpQkFBaUIsQ0FDOUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDWixNQUFNLEVBQ04sT0FBTyxFQUNQLE9BQU8sQ0FDUixDQUFDO0lBQ0YsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQW5DRCxzQ0FtQ0MifQ==