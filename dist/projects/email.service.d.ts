import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private resend;
    private readonly forbiddenDomains;
    constructor(configService: ConfigService);
    private validateFromEmail;
    sendProjectInvite(toEmail: string, inviterName: string, projectName: string, projectId: string, token: string, isUnregisteredUser?: boolean): Promise<void>;
    sendCollaboratorAddedNotification(toEmail: string, inviterName: string, projectName: string, inviteeDisplayName: string, companyName?: string): Promise<void>;
}
