"use strict";
/*
This file is designed to be run to fund accounts and send packets when manually
testing ibc-setup and ibc-relayer on localhost.

Please configure the global variables to match the accounts displayed by
`ibc-setup keys list` before running.

Execute via:

yarn build && yarn test:unit ./src/lib/manual/create-packets.spec.ts
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const helpers_1 = require("../helpers");
const consts_1 = require("./consts");
ava_1.default.serial.skip("send valid packets on existing channel", async (t) => {
    // create the basic clients
    const logger = new helpers_1.TestLogger();
    const [src, dest] = await (0, helpers_1.setup)(helpers_1.gaia, helpers_1.wasmd, logger);
    // send some from src to dest
    const srcAmounts = [1200, 32222, 3456];
    const srcPackets = await (0, helpers_1.transferTokens)(src, helpers_1.gaia.denomFee, dest, helpers_1.wasmd.prefix, consts_1.channels.src, srcAmounts);
    t.is(srcAmounts.length, srcPackets.length);
    // send some from dest to src
    const destAmounts = [426238, 321989];
    const destPackets = await (0, helpers_1.transferTokens)(dest, helpers_1.wasmd.denomFee, src, helpers_1.gaia.prefix, consts_1.channels.dest, destAmounts);
    t.is(destAmounts.length, destPackets.length);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXBhY2tldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbWFudWFsL2NyZWF0ZS1wYWNrZXRzLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7O0VBVUU7Ozs7O0FBRUYsOENBQXVCO0FBRXZCLHdDQUE0RTtBQUU1RSxxQ0FBb0M7QUFFcEMsYUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3JFLDJCQUEyQjtJQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFVLEVBQUUsQ0FBQztJQUNoQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU0sSUFBQSxlQUFLLEVBQUMsY0FBSSxFQUFFLGVBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUVyRCw2QkFBNkI7SUFDN0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUNyQyxHQUFHLEVBQ0gsY0FBSSxDQUFDLFFBQVEsRUFDYixJQUFJLEVBQ0osZUFBSyxDQUFDLE1BQU0sRUFDWixpQkFBUSxDQUFDLEdBQUcsRUFDWixVQUFVLENBQ1gsQ0FBQztJQUNGLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFM0MsNkJBQTZCO0lBQzdCLE1BQU0sV0FBVyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUN0QyxJQUFJLEVBQ0osZUFBSyxDQUFDLFFBQVEsRUFDZCxHQUFHLEVBQ0gsY0FBSSxDQUFDLE1BQU0sRUFDWCxpQkFBUSxDQUFDLElBQUksRUFDYixXQUFXLENBQ1osQ0FBQztJQUNGLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUMifQ==