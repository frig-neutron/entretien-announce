/**
 * Email message interface
 */
export interface Announcement {
  primary_recipient: string
  secondary_recipients: string[]
  subject: string,
  body: string
}
