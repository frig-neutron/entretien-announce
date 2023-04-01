import {DirectoryEntry, parseRoutingDirectory, Role} from "../src/intake-directory";

describe("intake directory", () => {
  // typescript inserts ordinals into enums, in addition to the keys
  // we don't want them, so this filters them out
  const StringIsNumber = (value: any) => isNaN(Number(value));
  const roleLiterals = Object.values(Role).filter(StringIsNumber)

  /**
   * JDT won't verify that enum schemas have every enum member as this isn't generally feasible in typescript (per docs)
   * So we have to test each enum element individually.
   */
  test.each(roleLiterals)("Parse routing directory with role %p", (role) => {
    const dir: DirectoryEntry = {
      email: `gurdy${Math.random()}@gurdy.com` ,
      name: "'🐱' + Math.random()",
      roles: [role as keyof typeof Role]
    }

    return expect(parseRoutingDirectory(
        JSON.stringify([dir])
    )).resolves.toEqual([dir])
  })

  test("validate email", () => {
    const dir: DirectoryEntry = {
      email: 'not an email' ,
      name: "drifter",
      roles: ["TRIAGE"]
    }

    return expect(parseRoutingDirectory(
        JSON.stringify([dir])
    )).rejects.toThrow("email of drifter is invalid: 'not an email'")
  })
})
