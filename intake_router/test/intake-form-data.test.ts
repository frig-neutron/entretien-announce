import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";


function expectParseFailsWithMessage(serializedWithMissingKey: string, errorMessage: string) {
  const parseResult = parseIntakeFormData(serializedWithMissingKey);
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
      JSON.stringify(sampleForm)
  ]
  test.each(rawFormDataEncoding)("parse ok", (rawData: any) => {
    return expect(parseIntakeFormData(rawData)).resolves.toEqual(sampleForm)
  })
  test.each(Object.keys(sampleForm))("fail validation if property missing", (key: string) => {
    const sampleFormCopy: any = {
      ...sampleForm
    }
    delete sampleFormCopy[key]
    const serializedWithMissingKey = JSON.stringify(sampleFormCopy);
    return expectParseFailsWithMessage(serializedWithMissingKey, "missing required properties 120")
  })

})

function zeroToTen() {
  return Math.floor(Math.random() * 10);
}
