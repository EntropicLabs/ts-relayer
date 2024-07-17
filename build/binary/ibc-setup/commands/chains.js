"use strict";
/** This is info for tests **/
Object.defineProperty(exports, "__esModule", { value: true });
exports.wasmdChain = exports.gaiaChain = void 0;
exports.gaiaChain = {
    prefix: "cosmos",
    chain_id: "gaia-testing",
    gas_price: "0.025uatom",
    rpc: ["http://localhost:26655"],
    ics20Port: "custom",
    estimated_block_time: 400,
    estimated_indexer_time: 80,
};
exports.wasmdChain = {
    prefix: "wasm",
    chain_id: "testing",
    gas_price: "0.025ucosm",
    rpc: ["http://localhost:26659"],
    ics20Port: "transfer",
    estimated_block_time: 400,
    estimated_indexer_time: 80,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhaW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMvY2hhaW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4QkFBOEI7OztBQUVqQixRQUFBLFNBQVMsR0FBRztJQUN2QixNQUFNLEVBQUUsUUFBUTtJQUNoQixRQUFRLEVBQUUsY0FBYztJQUN4QixTQUFTLEVBQUUsWUFBWTtJQUN2QixHQUFHLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQztJQUMvQixTQUFTLEVBQUUsUUFBUTtJQUNuQixvQkFBb0IsRUFBRSxHQUFHO0lBQ3pCLHNCQUFzQixFQUFFLEVBQUU7Q0FDM0IsQ0FBQztBQUVXLFFBQUEsVUFBVSxHQUFHO0lBQ3hCLE1BQU0sRUFBRSxNQUFNO0lBQ2QsUUFBUSxFQUFFLFNBQVM7SUFDbkIsU0FBUyxFQUFFLFlBQVk7SUFDdkIsR0FBRyxFQUFFLENBQUMsd0JBQXdCLENBQUM7SUFDL0IsU0FBUyxFQUFFLFVBQVU7SUFDckIsb0JBQW9CLEVBQUUsR0FBRztJQUN6QixzQkFBc0IsRUFBRSxFQUFFO0NBQzNCLENBQUMifQ==