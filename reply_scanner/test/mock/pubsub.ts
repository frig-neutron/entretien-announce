import {GASPubsubPublisher} from "../../appscript/pubsub_publisher";

declare var global: typeof globalThis; // can't use @types/node

export interface PublishInteractions {
  assertPublishInteractions(): void
}

function mockPublishing(): PublishInteractions {
  const mockGASPubsubPublisher: GASPubsubPublisher = {
      publish: jest.fn()
    };

  jest.mock("../../appscript/pubsub_publisher", () => {
    return {
      GASPubsubPublisher: jest.fn().mockImplementation(() => {
        return mockGASPubsubPublisher
      })
    }
  })

  return {
    assertPublishInteractions() {
      expect(mockGASPubsubPublisher.publish).toHaveBeenCalledTimes(1)
    }
  }
}

export {mockPublishing}
