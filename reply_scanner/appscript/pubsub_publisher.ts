
console.log("Real publisher loaded")
class GASPubsubPublisher {

  constructor() {
  }

  publish(data: String): void {
    console.log("real publish")
  }
}


export { GASPubsubPublisher }
