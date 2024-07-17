"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const helpers_1 = require("./lib/helpers");
async function main() {
    const nodeA = await (0, helpers_1.signingClient)({
        denomFee: "ukuji",
        estimatedBlockTime: 4000,
        estimatedIndexerTime: 100,
        minFee: "0.0034ukuji",
        prefix: "kujira",
        tendermintUrlHttp: "https://rpc.cosmos.directory/kujira",
    }, mnemonic);
    const nodeB = await (0, helpers_1.signingClient)({
        denomFee: "ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5",
        estimatedBlockTime: 2000,
        estimatedIndexerTime: 100,
        minFee: "0.025ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5",
        prefix: "dydx",
        tendermintUrlHttp: "https://rpc.cosmos.directory/dydx",
    }, mnemonic);
    const link = await lib_1.Link.createWithExistingConnections(nodeA, nodeB, "connection-122", "connection-9");
    await link.openInitializedChannel("A", "channel-168", "icacontroller-kujira1q9y3un4l9l2330ct508kdeh34s9c0nxw8ua9j4mhvkh8swucflys3y22s0-staking", "icahost", 1, '{"version":"ics27-1","controller_connection_id":"connection-122","host_connection_id":"connection-9","address":"","encoding":"proto3","tx_type":"sdk_multi_msg"}');
}
main()
    .catch(console.error)
    .finally(() => process.exit(0));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbkluaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY2hhbkluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQkFBNkI7QUFDN0IsMkNBQThDO0FBRTlDLEtBQUssVUFBVSxJQUFJO0lBQ2pCLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUMvQjtRQUNFLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsb0JBQW9CLEVBQUUsR0FBRztRQUN6QixNQUFNLEVBQUUsYUFBYTtRQUNyQixNQUFNLEVBQUUsUUFBUTtRQUNoQixpQkFBaUIsRUFBRSxxQ0FBcUM7S0FDekQsRUFDRCxRQUFRLENBQ1QsQ0FBQztJQUVGLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUMvQjtRQUNFLFFBQVEsRUFDTixzRUFBc0U7UUFDeEUsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixvQkFBb0IsRUFBRSxHQUFHO1FBQ3pCLE1BQU0sRUFDSiwyRUFBMkU7UUFDN0UsTUFBTSxFQUFFLE1BQU07UUFDZCxpQkFBaUIsRUFBRSxtQ0FBbUM7S0FDdkQsRUFDRCxRQUFRLENBQ1QsQ0FBQztJQUNGLE1BQU0sSUFBSSxHQUFHLE1BQU0sVUFBSSxDQUFDLDZCQUE2QixDQUNuRCxLQUFLLEVBQ0wsS0FBSyxFQUNMLGdCQUFnQixFQUNoQixjQUFjLENBQ2YsQ0FBQztJQUVGLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUMvQixHQUFHLEVBQ0gsYUFBYSxFQUNiLHlGQUF5RixFQUN6RixTQUFTLEVBQ1QsQ0FBQyxFQUNELGtLQUFrSyxDQUNuSyxDQUFDO0FBQ0osQ0FBQztBQUVELElBQUksRUFBRTtLQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0tBQ3BCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMifQ==