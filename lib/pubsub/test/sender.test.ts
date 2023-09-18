import {mockDeep} from 'jest-mock-extended'; /* eslint-disable-line node/no-unpublished-import */
import {parsePublishConfig, PublishConfig, pubsubSender} from '../src/sender';
import {PubSub, Topic} from '@google-cloud/pubsub';

describe('pubsub sender', () => {
  test('pubsub send', () => {
    const pubsub = mockDeep<PubSub>();
    const topic = mockDeep<Topic>();
    /* eslint-disable */
    //@ts-ignore
    topic.publishMessage.mockResolvedValue('Yay!'); //type resolution picks up void overload, therefore ignore
    /* eslint-enable */

    pubsub.topic.mockReturnValue(topic);

    const topicName = 'idle_chatter';
    const sender = pubsubSender(
      {topic_name: topicName, project_id: 'orion'},
      () => pubsub
    );

    const announcement = {
      body: 'moo',
      primary_recipient: 'cow',
      secondary_recipients: ['cows'],
      subject: 'the global industrial food complex',
    };
    const res = sender.sendAnnouncement(announcement);

    expect(pubsub.topic).toBeCalledWith(topicName);
    expect(bufferData(topic.publishMessage.mock.calls[0][0])).toEqual(
      JSON.stringify(announcement)
    );
    expect(res).resolves.toEqual('Yay!');
  });

  test('parse sender config', () => {
    const refCfg: PublishConfig = {
      project_id: '🐱' + Math.random(),
      topic_name: '🐕' + Math.random(),
    };

    return expect(parsePublishConfig(JSON.stringify(refCfg))).resolves.toEqual(
      refCfg
    );
  });

  test('parse sender config fail', () => {
    return expect(parsePublishConfig('1')).rejects.toThrow();
  });
});

function bufferData(arg: any) {
  const {data} = arg;
  if (Buffer.isBuffer(data)) {
    return data.toString();
  } else {
    throw 'not a buffer';
  }
}
