
declare var global: typeof globalThis; // can't use @types/node

export interface PublishInteractions {
  assertPublishInteractions(): void
}

export function mockPublishing(): PublishInteractions {
  console.log("mocker called")
  jest.doMock("../../appscript/pubsub_publisher", () => {
    return {
      GASPubsubPublisher: jest.fn().mockImplementation(() => {
        console.log("new publisher")
        return {
          publish: jest.fn((data: string) => {
            console.log("publishing", data)
          })
        }
      })
    }
  });

  return {
    assertPublishInteractions() {
    }
  }
}
