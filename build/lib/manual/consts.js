"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channels = exports.wasmdAddress = exports.gaiaAddress = void 0;
const helpers_1 = require("../helpers");
// TODO: use env vars
// copy these values from `ibc-setup keys list`
exports.gaiaAddress = "cosmos1th0wrczcl2zatnku20zdmmctmdrwh22t89r4s0";
exports.wasmdAddress = "wasm1x8ztrc7zqj2t5jvtyr6ncv7fwp62z2y22alpwu";
// TODO: use env vars
// we assume src is gaia for all these tests
exports.channels = {
    src: {
        channelId: "channel-17",
        portId: helpers_1.gaia.ics20Port, // custom
    },
    dest: {
        channelId: "channel-15",
        portId: helpers_1.wasmd.ics20Port, // transfer
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tYW51YWwvY29uc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdDQUF5QztBQUd6QyxxQkFBcUI7QUFDckIsK0NBQStDO0FBQ2xDLFFBQUEsV0FBVyxHQUFHLCtDQUErQyxDQUFDO0FBQzlELFFBQUEsWUFBWSxHQUFHLDZDQUE2QyxDQUFDO0FBRTFFLHFCQUFxQjtBQUNyQiw0Q0FBNEM7QUFDL0IsUUFBQSxRQUFRLEdBQWdCO0lBQ25DLEdBQUcsRUFBRTtRQUNILFNBQVMsRUFBRSxZQUFZO1FBQ3ZCLE1BQU0sRUFBRSxjQUFJLENBQUMsU0FBUyxFQUFFLFNBQVM7S0FDbEM7SUFDRCxJQUFJLEVBQUU7UUFDSixTQUFTLEVBQUUsWUFBWTtRQUN2QixNQUFNLEVBQUUsZUFBSyxDQUFDLFNBQVMsRUFBRSxXQUFXO0tBQ3JDO0NBQ0YsQ0FBQyJ9