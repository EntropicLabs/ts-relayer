"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNoExistError = void 0;
function isNoExistError(err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof err === "object" && err.code === "ENOENT";
}
exports.isNoExistError = isNoExistError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXMtbm8tZXhpc3QtZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL2lzLW5vLWV4aXN0LWVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLGNBQWMsQ0FBQyxHQUFZO0lBQ3pDLDhEQUE4RDtJQUM5RCxPQUFPLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSyxHQUFXLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztBQUNuRSxDQUFDO0FBSEQsd0NBR0MifQ==