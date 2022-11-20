import Ajv, {JTDParser, JTDSchemaType} from "ajv/dist/jtd";
import addFormats from "ajv-formats"

export interface IntakeFormData {
  rowIndex: number
  building: string
  summary: string
  description: string
  area: string
  reporter: string
  priority: "regular"|"urgent"
}

const intakeFormDataSchema: JTDSchemaType<IntakeFormData> = {
  properties: {
    rowIndex: {
      type: "int32",
    },
    building: {
      type: "string"
    },
    summary: {
      type: "string",
      metadata: {
        comment: "aka 'element'"
      }
    },
    description: {
      type: "string"
    },
    area: {
      type: "string"
    },
    reporter: {
      type: "string"
    },
    priority: {
      enum: ["regular", "urgent"]
    }
  },
}

const ajv = new Ajv({verbose: true, allErrors: true})
addFormats(ajv)

export function parseIntakeFormData(data: any): Promise<IntakeFormData> {

  function validationError(validator: JTDParser<IntakeFormData>) {
    return TypeError(validator.message + " at position " + validator.position + " of <" + data + ">")
  }

  const parser = ajv.compileParser(intakeFormDataSchema);
  const parseResult = parser(String(data));
  return parseResult
      ? Promise.resolve(parseResult)
      : Promise.reject(validationError(parser))

}
