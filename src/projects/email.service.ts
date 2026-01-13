import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly forbiddenDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'yandex.com',
  ];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  private validateFromEmail(email: string): void {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid from email address');
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      throw new BadRequestException('Invalid from email address');
    }

    // Check if domain is in forbidden list
    if (this.forbiddenDomains.includes(domain)) {
      throw new BadRequestException(
        `Cannot use free email providers (${domain}) as sender. Please configure RESEND_FROM_EMAIL with a custom domain.`
      );
    }
  }

  async sendProjectInvite(
    toEmail: string,
    inviterName: string,
    projectName: string,
    projectId: string,
    token: string,
    isUnregisteredUser: boolean = false
  ): Promise<void> {
    try {
      const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
      
      if (!fromEmail) {
        throw new BadRequestException(
          'RESEND_FROM_EMAIL must be configured with a custom domain (not gmail.com or other free providers)'
        );
      }

      // Validate from email domain
      this.validateFromEmail(fromEmail);

      // Get frontend URL for invite link
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
      const inviteLink = `${frontendUrl}/projects/${projectId}/invite/accept?token=${token}`;
      const registerLink = `${frontendUrl}/register?email=${encodeURIComponent(toEmail)}&inviteToken=${token}`;
      
      let mainContent = '';
      if (isUnregisteredUser) {
        mainContent = `
          <p>
            <strong>${inviterName}</strong> has invited you to collaborate on the project:
            <strong>${projectName}</strong>.
          </p>
          <p>
            You don't have an account yet. Please register first, then you'll be automatically added to the project.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${registerLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 10px;">
              Register & Accept Invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #666; text-align: center;">
            Or copy and paste this link into your browser:<br>
            <a href="${registerLink}" style="color: #007bff; word-break: break-all;">${registerLink}</a>
          </p>
        `;
      } else {
        mainContent = `
          <p>
            <strong>${inviterName}</strong> has invited you to collaborate on the project:
            <strong>${projectName}</strong>.
          </p>
          <p>
            Click the button below to accept this invitation. This link will expire in 7 days.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${inviteLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #007bff; word-break: break-all;">${inviteLink}</a>
          </p>
        `;
      }
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Project Collaboration Invitation</h2>
          <p>Hello,</p>
          ${mainContent}
          <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0;"><strong>Project:</strong> ${projectName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Invited by:</strong> ${inviterName}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Expires: 7 days from now</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
          <p style="margin-top: 20px;">
            Best regards,<br>
            Project Management System
          </p>
        </div>
      `;

      await this.resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: `Invitation to collaborate on ${projectName}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Don't throw error - we don't want email failures to break the invite process
      // Just log it for debugging
    }
  }
}

