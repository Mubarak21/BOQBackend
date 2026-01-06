import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class BoqProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private clientRooms;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): void;
    handleLeaveRoom(client: Socket, roomId: string): void;
    emitProgress(roomId: string, progress: {
        current: number;
        total: number;
        message: string;
    }): void;
    emitComplete(roomId: string, data: any): void;
    emitError(roomId: string, error: string): void;
}
