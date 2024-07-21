
console.log("Real publisher loaded")
class GASPubsubPublisher {

  constructor(gcpProject: string, pubsubTarget: string, publisherSAKey: string) {
  }

  public publish(data: String): void {
    console.log("real publish")
  }
}


export { GASPubsubPublisher }
