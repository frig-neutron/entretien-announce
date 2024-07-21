import {mock} from "jest-mock-extended";
import PropertiesService = GoogleAppsScript.Properties.PropertiesService;
import Properties = GoogleAppsScript.Properties.Properties;
import {configKeys} from "../../appscript/Code";

declare var global: typeof globalThis; // can't use @types/node

const mockedConfigKeys: {[key: string]: any} = {}

const mockProps = mock<Properties>()
mockProps.getProperty.mockImplementation(key => {
  return mockedConfigKeys[key]
})

const propertiesService = mock<PropertiesService>({
      getScriptProperties: jest.fn((): Properties => mockProps)
    }
);

global.PropertiesService = propertiesService

type ConfigKey = keyof typeof configKeys
type ConfigProps = {[ key in ConfigKey]: string}
export function mockConfigProps(configProps: ConfigProps): void {
  let k: keyof typeof configProps
  for (k in configProps) {
    mockedConfigKeys[configKeys[k]] = configProps[k]
  }
}

export { ConfigKey, ConfigProps }
