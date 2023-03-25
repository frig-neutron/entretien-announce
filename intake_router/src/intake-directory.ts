import {PublishConfig} from "pubsub_lalliance/build/src/sender";
import {JTDDataType, JTDSchemaType} from "ajv/dist/jtd";
import Ajv, {JTDParser} from "ajv/dist/jtd";

const ajv = new Ajv({verbose: true, allErrors: true})

export enum Role {
  BR_3735,
  BR_3737,
  BR_3739,
  BR_3743,
  BR_3745,
  TRIAGE
}

export interface DirectoryEntry {
  name: string,
  email: string,
  roles: (keyof typeof Role)[]
}

const directorySchema: JTDSchemaType<DirectoryEntry[]> = {
  elements: {
    properties: {
      name: {
        type: "string"
      },
      email: {
        type: "string"
      },
      roles: {
        elements: {
          enum:
              ["TRIAGE", "BR_3735", "BR_3737", "BR_3739", "BR_3743", "BR_3745"]
        }
      }
    }
  }
}

export function parseRoutingDirectory(data: any): Promise<DirectoryEntry[]> {
  const parser = ajv.compileParser(directorySchema);
  const parseResult = parser(String(data))

  return parseResult
    ? Promise.resolve(parseResult)
    : Promise.reject();
}
