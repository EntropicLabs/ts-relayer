"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.borderlessTable = void 0;
const table_1 = require("table");
function borderlessTable(data) {
    return (0, table_1.table)(data, {
        border: (0, table_1.getBorderCharacters)(`void`),
        columnDefault: {
            paddingLeft: 0,
            paddingRight: 4,
        },
        drawHorizontalLine: () => {
            return false;
        },
    });
}
exports.borderlessTable = borderlessTable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9yZGVybGVzcy10YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaW5hcnkvdXRpbHMvYm9yZGVybGVzcy10YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBbUQ7QUFFbkQsU0FBZ0IsZUFBZSxDQUFDLElBQTJCO0lBQ3pELE9BQU8sSUFBQSxhQUFLLEVBQUMsSUFBSSxFQUFFO1FBQ2pCLE1BQU0sRUFBRSxJQUFBLDJCQUFtQixFQUFDLE1BQU0sQ0FBQztRQUNuQyxhQUFhLEVBQUU7WUFDYixXQUFXLEVBQUUsQ0FBQztZQUNkLFlBQVksRUFBRSxDQUFDO1NBQ2hCO1FBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFYRCwwQ0FXQyJ9