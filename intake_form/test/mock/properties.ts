import {mock} from "jest-mock-extended";
import PropertiesService = GoogleAppsScript.Properties.PropertiesService;
import Properties = GoogleAppsScript.Properties.Properties;
import {functionEndpontConfigKey} from "../../appscript/Code";

declare var global: typeof globalThis; // can't use @types/node

export function mockConfigurationViaThePropertiesService(functionEndpoint: string) {
  const props = mock<Properties>()
  props.getProperty.mockImplementation(key => {
    return key === functionEndpontConfigKey ? functionEndpoint : null
  })
  const propertiesService = mock<PropertiesService>({
        getScriptProperties: jest.fn((): Properties => props)
      }
  );
  global.PropertiesService = propertiesService

  return {
    propertiesService: propertiesService,
    assertEndpointHasBeenSet: () => {
      expect(props.setProperty).toBeCalledWith(functionEndpontConfigKey, functionEndpoint)
    }
  }
}
