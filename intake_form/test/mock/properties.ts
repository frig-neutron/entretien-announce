import {mock} from "jest-mock-extended";
import PropertiesService = GoogleAppsScript.Properties.PropertiesService;
import Properties = GoogleAppsScript.Properties.Properties;
import {functionEndpontConfigKey} from "../../appscript/Code";

declare var global: typeof globalThis; // can't use @types/node

export function mockThePropertiesService() {
  const props = mock<Properties>()
  const propertiesService = mock<PropertiesService>({
        getScriptProperties: jest.fn((): Properties => props)
      }
  );
  global.PropertiesService = propertiesService

  return {
    propertiesService: propertiesService,
    assertEndpointHasBeenSetTo: (expectedEndpoint: string) => {
      expect(props.setProperty).toBeCalledWith(functionEndpontConfigKey, expectedEndpoint)
    }
  }
}
