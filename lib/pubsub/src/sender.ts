import {PubSub} from '@google-cloud/pubsub';
import {Announcement} from 'struct_lalliance/build/src/announcement';

/**
 * Transport adaptor. Probably email but could be pubsub one day.
 */
export interface Sender {
  sendAnnouncement(announcement: Announcement): Promise<any>;
}

// using snake case b/c this is deserialized from input json where I use snakes
export interface PublishConfig {
  project_id: string;
  topic_name: string;
}

const defaultPubsubFactory = (projectId: string) => new PubSub({projectId});

export function pubsubSender(
  cfg: PublishConfig,
  pubsubFactory = defaultPubsubFactory
): Sender {
  const pubsub = pubsubFactory(cfg.project_id);
  return {
    sendAnnouncement(announcement: Announcement): Promise<any> {
      const bufferedAnnouncement = Buffer.from(JSON.stringify(announcement));
      return pubsub
        .topic(cfg.topic_name)
        .publishMessage({data: bufferedAnnouncement});
    },
  };
}

export function parsePublishConfig(data: any): Promise<PublishConfig> {
  return Promise.resolve({
    project_id: '',
    topic_name: data,
  });
}
