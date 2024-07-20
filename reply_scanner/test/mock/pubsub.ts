import {GASPubsubPublisher} from "../../appscript/pubsub_publisher";

declare var global: typeof globalThis; // can't use @types/node

export interface PublishInteractions {
  assertPublishInteractions(): void
}

function mockPublishing(): PublishInteractions {
  const mockGASPubsubPublisher: GASPubsubPublisher = {
      publish: jest.fn()
    };

  const mockedPublisherModule = {
    GASPubsubPublisher: jest.fn().mockImplementation(() => {
      return mockGASPubsubPublisher
    })
  };

  const mock = jest.mock("../../appscript/pubsub_publisher", () => {
    return mockedPublisherModule
  });

  return {
    assertPublishInteractions() {
      expect(mockedPublisherModule.GASPubsubPublisher).toBeCalledTimes(1)
      // expect(mockGASPubsubPublisher.publish).toHaveBeenCalledTimes(1)
    }
  }
}

export {mockPublishing}
