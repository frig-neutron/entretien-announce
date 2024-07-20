
console.log("Real publisher loaded")
class GASPubsubPublisher {

  constructor() {
  }

  public publish(data: String): void {
    console.log("real publish")
  }
}


export { GASPubsubPublisher }
