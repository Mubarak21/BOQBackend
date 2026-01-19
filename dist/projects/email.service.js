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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailService = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.forbiddenDomains = [
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
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured in environment variables');
        }
        this.resend = new resend_1.Resend(apiKey);
    }
    validateFromEmail(email) {
        if (!email || !email.includes('@')) {
            throw new common_1.BadRequestException('Invalid from email address');
        }
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) {
            throw new common_1.BadRequestException('Invalid from email address');
        }
        if (this.forbiddenDomains.includes(domain)) {
            throw new common_1.BadRequestException(`Cannot use free email providers (${domain}) as sender. Please configure RESEND_FROM_EMAIL with a custom domain.`);
        }
    }
    async sendProjectInvite(toEmail, inviterName, projectName, projectId, token, isUnregisteredUser = false) {
        const fromEmail = this.configService.get('RESEND_FROM_EMAIL');
        try {
            if (!fromEmail) {
                throw new common_1.BadRequestException('RESEND_FROM_EMAIL must be configured with a custom domain (not gmail.com or other free providers)');
            }
            this.validateFromEmail(fromEmail);
            const fromDomain = fromEmail.split('@')[1]?.toLowerCase();
            if (fromDomain === 'resend.dev') {
                console.warn('⚠️ WARNING: Using resend.dev domain. Emails can only be sent to the email address associated with your Resend account. ' +
                    'To send to other recipients, you must verify your own domain in the Resend dashboard.');
            }
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:8080';
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
            }
            else {
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
            console.log('Sending email via Resend:', {
                from: fromEmail,
                to: toEmail,
                subject: `Invitation to collaborate on ${projectName}`,
            });
            const result = await this.resend.emails.send({
                from: fromEmail,
                to: toEmail,
                subject: `Invitation to collaborate on ${projectName}`,
                html: htmlContent,
            });
            if (result.error) {
                const errorMessage = result.error.message || JSON.stringify(result.error);
                if (errorMessage.includes('403') || errorMessage.includes('domain')) {
                    console.error('⚠️ Domain verification issue. If using resend.dev, you can only send to your account email. ' +
                        'For other recipients, verify your own domain in Resend dashboard.');
                }
                throw new Error(`Failed to send email: ${errorMessage}`);
            }
            console.log('✅ Email sent successfully:', {
                id: result.data?.id,
                to: toEmail,
            });
        }
        catch (error) {
            console.error('Error details:', {
                message: error?.message,
                stack: error?.stack,
                toEmail,
                fromEmail,
                hasApiKey: !!this.configService.get('RESEND_API_KEY'),
                hasFromEmail: !!this.configService.get('RESEND_FROM_EMAIL'),
            });
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map