/**
 * ANNOUNCEMENT, annoucer copy
 *
 * ATTN!!!
 * Pending the resolution of https://github.com/frig-neutron/entretien-announce/issues/10 any changes made to this file
 * must be manually replicated in {@link sendmail/src/announcement.ts}
 */
export interface Announcement {
  primary_recipient: string
  secondary_recipients: string[]
  subject: string,
  body: string
}
