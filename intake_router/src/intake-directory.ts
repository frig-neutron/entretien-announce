import Ajv, {JTDSchemaType} from "ajv/dist/jtd";
import addFormats from "ajv-formats"

const ajv = new Ajv({verbose: true, allErrors: true})
addFormats(ajv, ["email"])
const emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;


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

  function validateDirectory(entries: DirectoryEntry[]): DirectoryEntry[] {
    function validateEmail(entry: DirectoryEntry) {
      if (!emailRegex.test(entry.email)) {
        throw Error(`email of ${entry.name} is invalid: '${entry.email}'`)
      }
    }

    entries.forEach(validateEmail)
    return entries
  }

  return parseResult
      ? Promise.resolve(parseResult).then(validateDirectory)
      : Promise.reject(`Bad routing directory: ${data}`);
}
