"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVisitorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_visitor_dto_1 = require("./create-visitor.dto");
class UpdateVisitorDto extends (0, mapped_types_1.PartialType)(create_visitor_dto_1.CreateVisitorDto) {
}
exports.UpdateVisitorDto = UpdateVisitorDto;
//# sourceMappingURL=update-visitor.dto.js.map