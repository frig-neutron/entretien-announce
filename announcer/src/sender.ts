import {Announcement} from "./announcement_factory";
import {createTransport} from "nodemailer"
/**
 * Transport adaptor. Probably email but could be pubsub one day.
 */
export interface Sender {
  sendAnnouncement(announcement: Announcement): Promise<void>
}

export interface SmtpConfig {
  username: string,
  password: string,
  serverHost: string,
  mailFrom: string
}


export function smtpSender(config: SmtpConfig): Sender {
  const transporter = createTransport({
    host: config.serverHost,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: config.username,
      pass: config.password,
    },
  });

  transporter.verify().then(console.log).catch(console.error);

  return {
    async sendAnnouncement(announcement: Announcement): Promise<void> {
      const info = await transporter.sendMail({
        from: config.mailFrom,
        to: announcement.primaryRecipient,
        subject: announcement.subject,
        html: announcement.body
      })
      console.log(info)
    }
  }
}
