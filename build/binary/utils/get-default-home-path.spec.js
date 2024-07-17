"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const get_default_home_path_1 = require("./get-default-home-path");
const processEnvCopy = { ...process.env };
ava_1.default.beforeEach(() => {
    process.env = processEnvCopy;
});
(0, ava_1.default)("returns path if $HOME variable is set", (t) => {
    process.env.HOME = "/home/user";
    t.is((0, get_default_home_path_1.getDefaultHomePath)(), "/home/user/.ibc-setup");
    process.env.HOME = "/home/pathEndingWithSlash/";
    t.is((0, get_default_home_path_1.getDefaultHomePath)(), "/home/pathEndingWithSlash/.ibc-setup");
});
(0, ava_1.default)("throws if $HOME variable is undefined", (t) => {
    delete process.env.HOME;
    t.throws(() => (0, get_default_home_path_1.getDefaultHomePath)(), {
        instanceOf: Error,
        message: /is not set/,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWRlZmF1bHQtaG9tZS1wYXRoLnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL2dldC1kZWZhdWx0LWhvbWUtcGF0aC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsOENBQXVCO0FBRXZCLG1FQUE2RDtBQUU3RCxNQUFNLGNBQWMsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFDLGFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLE9BQU8sQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBQSxhQUFJLEVBQUMsdUNBQXVDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7SUFDaEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDBDQUFrQixHQUFFLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUVwRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyw0QkFBNEIsQ0FBQztJQUNoRCxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsMENBQWtCLEdBQUUsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0FBQ3JFLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBQSxhQUFJLEVBQUMsdUNBQXVDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNsRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBRXhCLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSwwQ0FBa0IsR0FBRSxFQUFFO1FBQ25DLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE9BQU8sRUFBRSxZQUFZO0tBQ3RCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIn0=