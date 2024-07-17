"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const InvalidOptionError_1 = require("../../exceptions/InvalidOptionError");
const resolve_option_1 = require("./resolve-option");
const stringOption1 = "string option 1";
const stringOption2 = "string option 2";
const functionWithString = () => "function option";
const functionWithNumber = () => 5;
const functionWithNull = () => {
    return null;
};
(0, ava_1.default)("leftmost defined option takes precedence", (t) => {
    const option1 = (0, resolve_option_1.resolveOption)("option")(undefined, undefined, stringOption1);
    t.is(option1, stringOption1);
    const option2 = (0, resolve_option_1.resolveOption)("option")(stringOption2, undefined, undefined);
    t.is(option2, stringOption2);
    const option3 = (0, resolve_option_1.resolveOption)("option")(stringOption2, stringOption1, stringOption1, stringOption1, undefined);
    t.is(option3, stringOption2);
    const option4 = (0, resolve_option_1.resolveOption)("option", { integer: true })(10, 5, 1);
    t.is(option4, 10);
    const option5 = (0, resolve_option_1.resolveOption)("option", { integer: true })("7", "4", 1);
    t.is(option5, 7);
    const option6 = (0, resolve_option_1.resolveOption)("option", { integer: true })(null, null, undefined, null, 4, "7");
    t.is(option6, 4);
});
(0, ava_1.default)("resolves function arguments", (t) => {
    const option1 = (0, resolve_option_1.resolveOption)("option")(undefined, functionWithString, stringOption1);
    t.is(option1, "function option");
    const option2 = (0, resolve_option_1.resolveOption)("option")(functionWithString, undefined, undefined);
    t.is(option2, "function option");
    const option3 = (0, resolve_option_1.resolveOption)("option")(undefined, functionWithNull, functionWithString, stringOption1, undefined);
    t.is(option3, "function option");
    const option4 = (0, resolve_option_1.resolveOption)("option", { integer: true })(undefined, functionWithNull, functionWithNumber, stringOption1, undefined);
    t.is(option4, 5);
    const option5 = (0, resolve_option_1.resolveOption)("option", { integer: true })(functionWithNumber, undefined, null, stringOption1, undefined);
    t.is(option5, 5);
});
(0, ava_1.default)("returns null for undefined/null options", (t) => {
    const option1 = (0, resolve_option_1.resolveOption)("option")(undefined, functionWithNull, null, undefined, functionWithNull);
    t.is(option1, null);
    const option2 = (0, resolve_option_1.resolveOption)("option")(undefined, null, undefined);
    t.is(option2, null);
    const option3 = (0, resolve_option_1.resolveOption)("option")(functionWithNull, functionWithNull, functionWithNull);
    t.is(option3, null);
});
(0, ava_1.default)("returns null for undefined/null options (integers)", (t) => {
    const option1 = (0, resolve_option_1.resolveOption)("option", { integer: true })(undefined, functionWithNull, null, undefined, functionWithNull);
    t.is(option1, null);
    const option2 = (0, resolve_option_1.resolveOption)("option", { integer: true })(undefined, null, undefined);
    t.is(option2, null);
    const option3 = (0, resolve_option_1.resolveOption)("option", { integer: true })(functionWithNull, functionWithNull, functionWithNull);
    t.is(option3, null);
});
(0, ava_1.default)("throws if resolved value is not an integer", (t) => {
    const option1 = () => (0, resolve_option_1.resolveOption)("option", { integer: true })("Abcdefgh", stringOption1, () => null, undefined);
    t.throws(option1, {
        instanceOf: InvalidOptionError_1.InvalidOptionError,
        message: /must be an integer/,
    });
    const option2 = () => (0, resolve_option_1.resolveOption)("option", { integer: true })(null, "seven", () => null, undefined);
    t.throws(option2, {
        instanceOf: InvalidOptionError_1.InvalidOptionError,
        message: /must be an integer/,
    });
});
(0, ava_1.default)("throws if all options are undefined or null", (t) => {
    const option1 = () => (0, resolve_option_1.resolveOption)("option", { required: true })(undefined, null, () => null, undefined);
    t.throws(option1, { instanceOf: InvalidOptionError_1.InvalidOptionError, message: /is required/ });
    const option2 = () => (0, resolve_option_1.resolveOption)("option", { required: true, integer: true })(undefined, null, () => null, undefined);
    t.throws(option2, { instanceOf: InvalidOptionError_1.InvalidOptionError, message: /is required/ });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1vcHRpb24uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvdXRpbHMvb3B0aW9ucy9yZXNvbHZlLW9wdGlvbi5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsOENBQXVCO0FBRXZCLDRFQUF5RTtBQUV6RSxxREFBaUQ7QUFFakQsTUFBTSxhQUFhLEdBQUcsaUJBQWlCLENBQUM7QUFDeEMsTUFBTSxhQUFhLEdBQUcsaUJBQWlCLENBQUM7QUFDeEMsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxNQUFNLGtCQUFrQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuQyxNQUFNLGdCQUFnQixHQUFHLEdBQUcsRUFBRTtJQUM1QixPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsQ0FBQztBQUVGLElBQUEsYUFBSSxFQUFDLDBDQUEwQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDckQsTUFBTSxPQUFPLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDN0UsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFN0IsTUFBTSxPQUFPLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0UsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFN0IsTUFBTSxPQUFPLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFFBQVEsQ0FBQyxDQUNyQyxhQUFhLEVBQ2IsYUFBYSxFQUNiLGFBQWEsRUFDYixhQUFhLEVBQ2IsU0FBUyxDQUNWLENBQUM7SUFDRixDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8s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