import {GASPubsubPublisher} from "../../appscript/pubsub_publisher";
import {EmailReceived} from "../../appscript/Code";
import CustomMatcherResult = jest.CustomMatcherResult;
import {mock} from "jest-mock-extended";
import {ConfigProps} from "./properties";

declare var global: typeof globalThis; // can't use @types/node

interface MessageEventMatchers {
  publishesEvents(events: EmailReceived[], expectedUrl?: string): void
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Matchers<R> extends MessageEventMatchers {
    }
  }
}

function extendJestWithMessageEventMatcher() {
  expect.extend({
    publishesEvents(received, events: EmailReceived[], expectedUrl?: string): CustomMatcherResult {
      if (!received) {
        return {
          pass: false,
          message: () => "No calls were made"
        }
      }

      const actualEvents = JSON.parse(received);
      expect(actualEvents).toMatchObject(events)
      return {
        pass: true,
        message: () => "discarded message"
      }
    }
  })
}

export interface PublishInteractions {
  assertPublishInteractions(): void
}

function mockPublishing(expectToPublish: EmailReceived[], configProps: ConfigProps): PublishInteractions {
  const {mockedModule, mockedPublisher} = setupMocks();
  extendJestWithMessageEventMatcher()
  return {
    assertPublishInteractions() {
      if (expectToPublish.length === 0) {
        expect(mockedModule.GASPubsubPublisher).toBeCalledTimes(0)
        expect(mockedPublisher.publish).toHaveBeenCalledTimes(0)
      } else {
        expect(mockedModule.GASPubsubPublisher).toBeCalledWith(
            configProps.gcpProject,
            configProps.pubsubTarget,
            configProps.publisherSAKey
        )
        expect(mockedPublisher.publish.mock.calls[0]).publishesEvents(expectToPublish)
      }
    }
  }
}

function mockPublishingError(): PublishInteractions {
  const {mockedModule, mockedPublisher} = setupMocks();
  mockedPublisher.publish.mockImplementation(() => {
    throw new Error("mock error")
  })
  return {
    assertPublishInteractions() {
      expect(mockedPublisher.publish).toHaveBeenCalledTimes(1)
    }
  }
}

function setupMocks() {
  const mockedPublisher = {
    publish: jest.fn()
  };

  const mockedModule = {
    GASPubsubPublisher: jest.fn().mockImplementation(() => {
      return mockedPublisher
    })
  };

  jest.mock("../../appscript/pubsub_publisher", () => {
    return mockedModule
  });

  return {mockedModule, mockedPublisher}
}


export {mockPublishing, mockPublishingError}
