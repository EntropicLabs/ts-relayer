"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveKeyFileOption = void 0;
const resolve_option_1 = require("../resolve-option");
function resolveKeyFileOption({ keyFileFlag, app }) {
    return (0, resolve_option_1.resolveOption)("keyFile")(keyFileFlag, process.env.KEY_FILE, app?.keyFile);
}
exports.resolveKeyFileOption = resolveKeyFileOption;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1rZXktZmlsZS1vcHRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL29wdGlvbnMvc2hhcmVkL3Jlc29sdmUta2V5LWZpbGUtb3B0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHNEQUFrRDtBQU9sRCxTQUFnQixvQkFBb0IsQ0FBQyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQVU7SUFDL0QsT0FBTyxJQUFBLDhCQUFhLEVBQUMsU0FBUyxDQUFDLENBQzdCLFdBQVcsRUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFDcEIsR0FBRyxFQUFFLE9BQU8sQ0FDYixDQUFDO0FBQ0osQ0FBQztBQU5ELG9EQU1DIn0=