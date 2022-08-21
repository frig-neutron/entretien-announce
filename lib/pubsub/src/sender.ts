import {PubSub} from '@google-cloud/pubsub';
import {Announcement} from 'struct_lalliance/build/src/announcement';
import {JTDSchemaType} from "ajv/dist/types/jtd-schema";
import Ajv, {JTDParser} from "ajv/dist/jtd";
import addFormats from "ajv-formats"

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
const ajv = new Ajv({verbose: true, allErrors: true})
addFormats(ajv)

const publishConfigSchema: JTDSchemaType<PublishConfig> = {
  properties: {
    project_id: {
      type: "string"
    },
    topic_name: {
      type: "string"
    }
  },
}

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

  function validationError<T>(validator: JTDParser<T>) {
    return TypeError(validator.message + " at position " + validator.position + " of <" + data + ">")
  }

  const parser = ajv.compileParser(publishConfigSchema);
  const parseResult = parser(String(data));
  return parseResult
      ? Promise.resolve(parseResult)
      : Promise.reject(validationError(parser))
}
