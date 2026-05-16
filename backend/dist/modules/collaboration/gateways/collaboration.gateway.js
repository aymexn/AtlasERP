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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CollaborationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("../../../common/guards/ws-jwt.guard");
let CollaborationGateway = CollaborationGateway_1 = class CollaborationGateway {
    constructor() {
        this.logger = new common_1.Logger(CollaborationGateway_1.name);
    }
    handleConnection(client) {
        const user = client.user;
        this.logger.log(`Client connected: ${client.id} ${user ? `(User: ${user.userId})` : '(Anonymous)'}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinUserRoom(client, userId) {
        client.join(`user_${userId}`);
        this.logger.log(`User ${userId} joined their room`);
    }
    handleJoinProject(client, projectId) {
        client.join(`project_${projectId}`);
        this.logger.log(`Client joined project room: ${projectId}`);
    }
    handleLeaveProject(client, projectId) {
        client.leave(`project_${projectId}`);
        this.logger.log(`Client left project room: ${projectId}`);
    }
    emitToUser(userId, event, data) {
        this.server.to(`user_${userId}`).emit(event, data);
    }
    emitToProject(projectId, event, data) {
        this.server.to(`project_${projectId}`).emit(event, data);
    }
    broadcast(event, data) {
        this.server.emit(event, data);
    }
};
exports.CollaborationGateway = CollaborationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CollaborationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_user_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "handleJoinUserRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "handleJoinProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "handleLeaveProject", null);
exports.CollaborationGateway = CollaborationGateway = CollaborationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtAuthGuard)
], CollaborationGateway);
//# sourceMappingURL=collaboration.gateway.js.map