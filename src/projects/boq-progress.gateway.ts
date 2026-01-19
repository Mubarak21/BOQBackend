import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/boq-progress',
})
export class BoqProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clientRooms = new Map<string, string>(); // socketId -> roomId

  handleConnection(client: Socket) {

  }

  handleDisconnect(client: Socket) {
    const roomId = this.clientRooms.get(client.id);
    if (roomId) {
      client.leave(roomId);
      this.clientRooms.delete(client.id);
    }

  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    this.clientRooms.set(client.id, roomId);

    client.emit('joined-room', { roomId });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    this.clientRooms.delete(client.id);

  }

  /**
   * Emit progress update to a specific room
   */
  emitProgress(roomId: string, progress: { current: number; total: number; message: string }) {
    this.server.to(roomId).emit('boq-progress', progress);
  }

  /**
   * Emit completion to a specific room
   */
  emitComplete(roomId: string, data: any) {
    this.server.to(roomId).emit('boq-complete', data);
  }

  /**
   * Emit error to a specific room
   */
  emitError(roomId: string, error: string) {
    this.server.to(roomId).emit('boq-error', { error });
  }
}

