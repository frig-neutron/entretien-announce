import {Announcement} from "./announcement_factory";
import {createTransport, Transporter} from "nodemailer"
import {logger as log} from "./logger";
import SMTPTransport from "nodemailer/lib/smtp-transport";

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

const defaultTransporterFactory: (options: SMTPTransport.Options) => Transporter<SMTPTransport.SentMessageInfo> = createTransport


export function smtpSender(config: SmtpConfig, transporterFactory = defaultTransporterFactory): Sender {
  const transporter = transporterFactory({
    host: config.smtp_host,
    port: 465,
    secure: true,
    auth: {
      user: config.smtp_username,
      pass: config.smtp_password,
    },
  });


  const verificationResult = transporter.
  verify().
  then(_ => log.info("Verified SMTP connection")).
  catch(e => {
    log.error(`SMTP verification error ${e}`)
    throw e // necessary to short-circuit sendMail
  });

  return {
    async sendAnnouncement(announcement: Announcement): Promise<void> {
      const info = await verificationResult.then(() => transporter.sendMail({
        from: config.smtp_from,
        to: announcement.primaryRecipient,
        subject: announcement.subject,
        html: announcement.body
      }))
      log.info({
        info: `Sent announcement to ${announcement.primaryRecipient}`,
        smtpInfo: info
      })
    }
  }
}
