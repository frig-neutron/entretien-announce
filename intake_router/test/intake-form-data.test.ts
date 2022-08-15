import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {Buffer} from "buffer";


function expectParseFailsWithMessage(serializedForm: string, errorMessage: string) {
  const parseResult = parseIntakeFormData(serializedForm);
  return expect(parseResult).rejects.toEqual(errorMessage);
}

describe("test form data", () => {
  const rnd = (base: String): string => base + "_" + zeroToTen()

  const sampleForm: IntakeFormData = {
    area: rnd("51"),
    building: rnd("37XX"),
    description: rnd("desc"),
    priority: rnd("prio"),
    reporter: rnd("skunk"),
    rowIndex: zeroToTen(),
    summary: rnd("summary"),
  }
  const rawFormDataEncoding = [
      JSON.stringify(sampleForm),
      Buffer.from(JSON.stringify(sampleForm))
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
        "unexpected token l at position 0 of <literal garbage>")
  })
  test("forbid additional properties", () => {
    const sampleFormCopy: any = {
      ...sampleForm
    }
    sampleFormCopy["extraField"] = "WellHelloThere"
    const serializedWithExtraKey = JSON.stringify(sampleFormCopy);
    const errorMessage = "property extraField not allowed at position 147 of <" + serializedWithExtraKey + ">";
    return expectParseFailsWithMessage(serializedWithExtraKey, errorMessage)

  })
})

function zeroToTen() {
  return Math.floor(Math.random() * 10);
}
