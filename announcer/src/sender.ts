import {Announcement} from "./announcement_factory";
import {createTransport} from "nodemailer"

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
  then(console.log).
  catch(console.error);

  return {
    async sendAnnouncement(announcement: Announcement): Promise<void> {
      const info = await transporter.sendMail({
        from: config.smtp_from,
        to: announcement.primaryRecipient,
        subject: announcement.subject,
        html: announcement.body
      })
      console.log(info)
    }
  }
}
