import Ajv, {JTDParser, JTDSchemaType} from "ajv/dist/jtd";
import addFormats from "ajv-formats"
import {json} from "express";

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
  function parseJsonData(jsonData: any) {
    function validationError(validator: JTDParser<IntakeFormData>) {
      return TypeError(validator.message + " at position " + validator.position + " of <" + data + ">")
    }

    const jsonString = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);

    const parser = ajv.compileParser(intakeFormDataSchema);
    const parseResult = parser(jsonString);
    return parseResult
        ? Promise.resolve(parseResult)
        : Promise.reject(validationError(parser))
  }

  function decodeBase64(data: string) {
    return Buffer.from(data, "base64").toString("utf-8");
  }

  try {
    const jsonData = JSON.parse(data)
    const dataAttribute = jsonData["data"];
    if (dataAttribute) {
      return parseJsonData(decodeBase64(dataAttribute))
    } else {
      return parseJsonData(jsonData);
    }
  }catch (e){
    return Promise.reject(Error(`<${data}> is not JSON`))
  }

}
