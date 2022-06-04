import {Announcement} from "./announcement";
import {PubSub} from "@google-cloud/pubsub";

/**
 * Transport adaptor. Probably email but could be pubsub one day.
 */
export interface Sender {
  sendAnnouncement(announcement: Announcement): Promise<any>
}

// using snake case b/c this is deserialized from input json where I use snakes
export interface PublishConfig {
  topic_name: string
}

const defaultPubsubFactory = () => new PubSub()

export function pubsubSender(cfg: PublishConfig, pubsubFactory = defaultPubsubFactory): Sender {
  const pubsub = pubsubFactory()
  return {
    sendAnnouncement(announcement: Announcement): Promise<any> {
      return pubsub.topic(cfg.topic_name).publishMessage({data: JSON.stringify(announcement)})
    }
  }
}
