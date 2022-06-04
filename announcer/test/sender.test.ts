import {mockDeep} from "jest-mock-extended";
import {pubsubSender} from "../src/sender";
import {PubSub, Topic} from "@google-cloud/pubsub";

describe("pubsub sender", () => {

  test("pubsub send", () => {
    const pubsub = mockDeep<PubSub>()
    const topic = mockDeep<Topic>()
    //@ts-ignore
    topic.publishMessage.mockResolvedValue("Yay!") //type resolution picks up void overload, therefore ignore
    pubsub.topic.mockReturnValue(topic)

    const topicName = "idle_chatter"
    const sender = pubsubSender({topic_name: topicName, project_id: "orion"}, () => pubsub)

    const announcement = {
      body: "moo",
      primary_recipient: "cow",
      secondary_recipients: ["cows"],
      subject: "the global industrial food complex"
    };
    const res = sender.sendAnnouncement(announcement);

    expect(pubsub.topic).toBeCalledWith(topicName)
    expect(bufferData(topic.publishMessage.mock.calls[0][0])).toEqual(JSON.stringify(announcement))
    expect(res).resolves.toEqual("Yay!")
  })
})

function bufferData(arg: any){
  const {data} = arg
  if (Buffer.isBuffer(data)){
    return data.toString()
  } else {
    throw "not a buffer"
  }
}
