import {Announcement} from "./announcement";

/**
 * Transport adaptor. Probably email but could be pubsub one day.
 */
export interface Sender {
  sendAnnouncement(announcement: Announcement): void
}

export function senderImpl(): Sender{
  return {
    sendAnnouncement(announcement: Announcement): void {
    }
  }
}
