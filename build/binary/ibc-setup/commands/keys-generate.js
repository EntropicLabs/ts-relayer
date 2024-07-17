"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.keysGenerate = void 0;
const fs_1 = __importDefault(require("fs"));
const generate_mnemonic_1 = require("../../utils/generate-mnemonic");
const resolve_option_1 = require("../../utils/options/resolve-option");
async function keysGenerate(flags, _logger) {
    const options = {
        keyFile: (0, resolve_option_1.resolveOption)("keyFile")(flags.keyFile, process.env.RELAYER_KEY_FILE),
    };
    await run(options);
}
exports.keysGenerate = keysGenerate;
function run(options) {
    const mnemonic = (0, generate_mnemonic_1.generateMnemonic)();
    if (options.keyFile) {
        fs_1.default.writeFileSync(options.keyFile, mnemonic, "utf-8");
        console.log(`Saved mnemonic to ${options.keyFile}`);
        return;
    }
    console.log(mnemonic);
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5cy1nZW5lcmF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXNldHVwL2NvbW1hbmRzL2tleXMtZ2VuZXJhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBR3BCLHFFQUFpRTtBQUNqRSx1RUFBbUU7QUFVNUQsS0FBSyxVQUFVLFlBQVksQ0FBQyxLQUFZLEVBQUUsT0FBZTtJQUM5RCxNQUFNLE9BQU8sR0FBRztRQUNkLE9BQU8sRUFBRSxJQUFBLDhCQUFhLEVBQUMsU0FBUyxDQUFDLENBQy9CLEtBQUssQ0FBQyxPQUFPLEVBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FDN0I7S0FDRixDQUFDO0lBRUYsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckIsQ0FBQztBQVRELG9DQVNDO0FBRUQsU0FBZ0IsR0FBRyxDQUFDLE9BQWdCO0lBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUEsb0NBQWdCLEdBQUUsQ0FBQztJQUVwQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDbkIsWUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNwRCxPQUFPO0tBQ1I7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hCLENBQUM7QUFWRCxrQkFVQyJ9