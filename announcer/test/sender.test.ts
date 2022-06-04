import {mockDeep} from "jest-mock-extended";
import {Transporter, TransportOptions} from "nodemailer";
import {pubsubSender, SmtpConfig, smtpSender} from "../src/sender";
import * as SMTPTransport from "nodemailer/lib/smtp-transport";
import {PubSub, Topic} from "@google-cloud/pubsub";

describe("pubsub sender", () => {

  test("pubsub send", () => {
    const pubsub = mockDeep<PubSub>()
    const topic = mockDeep<Topic>()
    //@ts-ignore
    topic.publishMessage.mockResolvedValue("Yay!") //type resolution picks up void overload, therefore ignore
    pubsub.topic.mockReturnValue(topic)

    const topicName = "idle_chatter"
    const sender = pubsubSender({topic_name: topicName}, () => pubsub)

    const announcement = {
      body: "moo",
      primary_recipient: "cow",
      secondary_recipients: ["cows"],
      subject: "the global industrial food complex"
    };
    const res = sender.sendAnnouncement(announcement);

    expect(pubsub.topic).toBeCalledWith(topicName)
    expect(topic.publishMessage.mock.calls[0][0]).toEqual({data: JSON.stringify(announcement)})
    expect(res).resolves.toEqual("Yay!")
  })
})

describe("smtp sender", () => {

  const transporter = mockDeep<Transporter<SMTPTransport.SentMessageInfo>>()
  const config: SmtpConfig = {
    smtp_from: "a.friend", smtp_host: "host", smtp_password: "hunter2", smtp_username: "vastador"
  }
  const transporterFactory: (options: TransportOptions) => Transporter<SMTPTransport.SentMessageInfo> =
      (opts: SMTPTransport.Options) => transporter

  test("transport validation success and mail send", async () => {
    transporter.verify.mockResolvedValue(true)

    const sender = smtpSender(config, transporterFactory)
    await sender.sendAnnouncement({
      body: "moo",
      primary_recipient: "cow",
      secondary_recipients: ["cows"],
      subject: "the global industrial food complex"
    })

    expect(transporter.verify).toBeCalledTimes(1)
    expect(transporter.sendMail).toBeCalledTimes(1)
    expect(transporter.sendMail).toBeCalledWith(
        {
          from: "a.friend",
          to: "cow",
          subject: "the global industrial food complex",
          html: "moo"
        })
  })

  test("transport verification failure short-circuits sending mail", async () => {
    transporter.verify.mockRejectedValue(new Error("god says no"))

    const sender = smtpSender(config, transporterFactory)
    const sendAnnouncement = async () => {
      return sender.sendAnnouncement({
        body: "", primary_recipient: "", secondary_recipients: [], subject: ""
      })
    }

    // hit send twice so we can verify verification invoked once
    await expect(sendAnnouncement).rejects.toThrow(new Error("god says no"))
    await expect(sendAnnouncement).rejects.toThrow(new Error("god says no"))
    await expect(transporter.verify).toBeCalledTimes(1)
    await expect(transporter.sendMail).toBeCalledTimes(0)
  })

  test("mail send failure error", async () => {
    transporter.verify.mockResolvedValue(true)
    transporter.sendMail.mockRejectedValue(new Error("rozkomnadzor says no"))

    const sender = smtpSender(config, transporterFactory)
    const sendAnnouncement = async () => {
      return sender.sendAnnouncement({
        body: "", primary_recipient: "", secondary_recipients: [], subject: ""
      })
    }

    await expect(sendAnnouncement).rejects.toThrow(new Error("rozkomnadzor says no"))
    await expect(transporter.verify).toBeCalledTimes(1)
    await expect(transporter.sendMail).toBeCalledTimes(1)
  })
})
