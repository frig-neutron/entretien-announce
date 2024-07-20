import {mock} from "jest-mock-extended";
import PropertiesService = GoogleAppsScript.Properties.PropertiesService;
import Properties = GoogleAppsScript.Properties.Properties;
import {functionEndpointConfigKey, robotEmailConfigKey} from "../../appscript/Code";

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

export function mockPropertiesServiceFunctionEndpoint(functionEndpoint: string) {
  mockedConfigKeys[functionEndpointConfigKey] = functionEndpoint
  return {
    propertiesService: propertiesService,
    assertEndpointHasBeenSet: () => {
      expect(mockProps.setProperty).toBeCalledWith(functionEndpointConfigKey, functionEndpoint)
    }
  }
}

export function mockRobotEmail(robotEmail: string): void {
  mockedConfigKeys[robotEmailConfigKey] = robotEmail
}
