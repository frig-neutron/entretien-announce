// import {GASPubsubPublisher} from "../../appscript/pubsub_publisher";
// const gasMock = jest.mock("../../appscript/pubsub_publisher")
declare var global: typeof globalThis; // can't use @types/node

export interface PublishInteractions {
  assertPublishInteractions(): void
}

async function mockPublishing(): Promise<PublishInteractions> {
  jest.mock("../../appscript/pubsub_publisher").clearAllMocks()
  const GASClientModule = await import("../../appscript/pubsub_publisher")

  console.log("mocker called")
  // jest.doMock("../../appscript/pubsub_publisher", () => {
  //   return {
  //     GASPubsubPublisher: jest.fn().mockImplementation(() => {
  //       console.log("new publisher")
  //       return {
  //         publish: jest.fn((data: string) => {
  //           console.log("publishing", data)
  //         })
  //       }
  //     })
  //   }
  // });

  return {
    assertPublishInteractions() {
      expect(GASClientModule.GASPubsubPublisher).toHaveBeenCalledTimes(1)
    }
  }
}

export { mockPublishing }
