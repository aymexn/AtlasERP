import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: any): void;
    handleDisconnect(client: Socket): void;
    handleJoinUserRoom(client: Socket, userId: string): void;
    handleJoinProject(client: Socket, projectId: string): void;
    handleLeaveProject(client: Socket, projectId: string): void;
    emitToUser(userId: string, event: string, data: any): void;
    emitToProject(projectId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
}
