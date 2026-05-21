import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  handleConnection(client: Socket) {
    const companyId = client.handshake.query.companyId as string;
    if (companyId) {
      client.join(companyId);
      this.logger.log(`Client ${client.id} joined company room: ${companyId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  broadcastKpiUpdate(companyId: string, data: any) {
    this.logger.log(`Broadcasting KPI update for company ${companyId}`);
    this.server.to(companyId).emit('dashboard:refresh', data);
  }
}
