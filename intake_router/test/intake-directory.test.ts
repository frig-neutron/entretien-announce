import {DirectoryEntry, parseRoutingDirectory} from "../src/intake-directory";

describe("intake directory", () => {
  test("parse routing directory", () => {
    const dir: DirectoryEntry = {
      email: `gurdy${Math.random()}@gurdy.com` ,
      name: '🐱' + Math.random(),
      roles: ["TRIAGE"]
    }

    return expect(parseRoutingDirectory(
        JSON.stringify([dir])
    )).resolves.toEqual([dir])
  })
})
