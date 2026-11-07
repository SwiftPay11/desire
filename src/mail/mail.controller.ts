import {
  Controller,
  Post,
} from '@nestjs/common';

import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
  ) { }

  @Post('test')
  async sendTestEmail() {
    const sent =
      await this.mailService.sendTestEmail();

    return {
      success: sent,
      message: sent
        ? 'DESIRE test email sent successfully.'
        : 'DESIRE test email could not be sent.',
    };
  }
}