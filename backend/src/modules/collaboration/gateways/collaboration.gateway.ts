import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
@UseGuards(WsJwtAuthGuard)
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  handleConnection(client: any) {
    const user = client.user;
    this.logger.log(`Client connected: ${client.id} ${user ? `(User: ${user.userId})` : '(Anonymous)'}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user_${userId}`);
    this.logger.log(`User ${userId} joined their room`);
  }

  @SubscribeMessage('join_project')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.join(`project_${projectId}`);
    this.logger.log(`Client joined project room: ${projectId}`);
  }

  @SubscribeMessage('leave_project')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.leave(`project_${projectId}`);
    this.logger.log(`Client left project room: ${projectId}`);
  }

  // Helper methods for other services to emit events
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project_${projectId}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
