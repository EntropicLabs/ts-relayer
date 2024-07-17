"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHomeOption = void 0;
const get_default_home_path_1 = require("../../get-default-home-path");
const resolve_option_1 = require("../resolve-option");
function resolveHomeOption({ homeFlag }) {
    return (0, resolve_option_1.resolveOption)("home", { required: true })(homeFlag, process.env.RELAYER_HOME, get_default_home_path_1.getDefaultHomePath);
}
exports.resolveHomeOption = resolveHomeOption;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1ob21lLW9wdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9iaW5hcnkvdXRpbHMvb3B0aW9ucy9zaGFyZWQvcmVzb2x2ZS1ob21lLW9wdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1RUFBaUU7QUFDakUsc0RBQWtEO0FBTWxELFNBQWdCLGlCQUFpQixDQUFDLEVBQUUsUUFBUSxFQUFVO0lBQ3BELE9BQU8sSUFBQSw4QkFBYSxFQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUM5QyxRQUFRLEVBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQ3hCLDBDQUFrQixDQUNuQixDQUFDO0FBQ0osQ0FBQztBQU5ELDhDQU1DIn0=