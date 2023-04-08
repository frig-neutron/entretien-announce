import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {Buffer} from "buffer";


async function expectParseFailsWithMessage(serializedForm: string, errorMessage: string) {
  const parseResult = parseIntakeFormData(serializedForm);
  await expect(parseResult).rejects.toEqual(TypeError(errorMessage))
}

describe("test form data", () => {
  const rnd = (base: String): string => base + "_" + zeroToTen()

  const sampleForm: IntakeFormData = {
    area: rnd("51"),
    building: rnd("37XX"),
    description: rnd("desc"),
    priority: "regular",
    reporter: rnd("skunk"),
    rowIndex: zeroToTen(),
    summary: rnd("summary"),
  }
  const pubsubEncoding = function (){
    return {
      "@type": "type.googleapis.com/google.pubsub.v1.PubsubMessage",
      "data": Buffer.from(JSON.stringify(sampleForm)).toString("base64")
    }
  }()
  const rawFormDataEncoding = [
    // JSON.stringify(sampleForm),
    // Buffer.from(JSON.stringify(sampleForm)),
    JSON.stringify(pubsubEncoding)
  ]
  test.each(rawFormDataEncoding)("parse case %# ok", (rawData: any) => {
    return expect(parseIntakeFormData(rawData)).resolves.toEqual(sampleForm)
  })
  test.each(Object.keys(sampleForm))("fail validation if property %s missing", (key: string) => {
    const sampleFormCopy: any = {
      ...sampleForm
    }
    delete sampleFormCopy[key]
    const serializedWithMissingKey = JSON.stringify(sampleFormCopy);
    const errorMessage = "missing required properties at position " + serializedWithMissingKey.length +
        " of <" + serializedWithMissingKey + ">";
    return expectParseFailsWithMessage(serializedWithMissingKey, errorMessage)
  })
  test("parse literal garbage", () => {
    return expectParseFailsWithMessage("literal garbage",
        "<literal garbage> is not JSON")
  })
  test("forbid additional properties", () => {
    const sampleFormCopy: any = {
      ...sampleForm
    }
    sampleFormCopy["extraField"] = "WellHelloThere"
    const serializedWithExtraKey = JSON.stringify(sampleFormCopy);
    const errorMessage = "property extraField not allowed at position 148 of <" + serializedWithExtraKey + ">";
    return expectParseFailsWithMessage(serializedWithExtraKey, errorMessage)

  })
})

function zeroToTen() {
  return Math.floor(Math.random() * 10);
}
