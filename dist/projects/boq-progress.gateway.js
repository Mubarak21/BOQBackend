"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoqProgressGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let BoqProgressGateway = class BoqProgressGateway {
    constructor() {
        this.clientRooms = new Map();
    }
    handleConnection(client) {
    }
    handleDisconnect(client) {
        const roomId = this.clientRooms.get(client.id);
        if (roomId) {
            client.leave(roomId);
            this.clientRooms.delete(client.id);
        }
    }
    handleJoinRoom(client, roomId) {
        client.join(roomId);
        this.clientRooms.set(client.id, roomId);
        client.emit('joined-room', { roomId });
    }
    handleLeaveRoom(client, roomId) {
        client.leave(roomId);
        this.clientRooms.delete(client.id);
    }
    emitProgress(roomId, progress) {
        this.server.to(roomId).emit('boq-progress', progress);
    }
    emitComplete(roomId, data) {
        this.server.to(roomId).emit('boq-complete', data);
    }
    emitError(roomId, error) {
        this.server.to(roomId).emit('boq-error', { error });
    }
};
exports.BoqProgressGateway = BoqProgressGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BoqProgressGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], BoqProgressGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], BoqProgressGateway.prototype, "handleLeaveRoom", null);
exports.BoqProgressGateway = BoqProgressGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        namespace: '/boq-progress',
    })
], BoqProgressGateway);
//# sourceMappingURL=boq-progress.gateway.js.map