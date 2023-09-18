/**
 * Email message interface
 */
export interface Announcement {
  primary_recipient: string;
  secondary_recipients: string[]; // todo: convert this to reply-to
  subject: string;
  body: string;
}
