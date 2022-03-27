import {Announcement} from "./announcement_factory";
import {createTransport} from "nodemailer"
import {logger as log} from "./logger";

/**
 * Transport adaptor. Probably email but could be pubsub one day.
 */
export interface Sender {
  sendAnnouncement(announcement: Announcement): Promise<void>
}

export interface SmtpConfig {
  smtp_username: string,
  smtp_password: string,
  smtp_host: string,
  smtp_from: string
}


export function smtpSender(config: SmtpConfig): Sender {
  const transporter = createTransport({
    host: config.smtp_host,
    port: 465,
    secure: true,
    auth: {
      user: config.smtp_username,
      pass: config.smtp_password,
    },
  });

  transporter.verify().
  then(_ => log.info("Verified SMTP connection")).
  catch(e => log.error(`SMTP verification error ${e}`));

  return {
    async sendAnnouncement(announcement: Announcement): Promise<void> {
      const info = await transporter.sendMail({
        from: config.smtp_from,
        to: announcement.primaryRecipient,
        subject: announcement.subject,
        html: announcement.body
      })
      log.info(`Sent announcement to ${announcement.primaryRecipient}: ${info.response}`)
    }
  }
}
