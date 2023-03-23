import {getTestServer} from "@google-cloud/functions-framework/build/src/testing";

import supertest from "supertest";
import * as functions from "@google-cloud/functions-framework";
import {mock} from "jest-mock-extended";
import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {parsePublishConfig, PublishConfig, pubsubSender, Sender} from "pubsub_lalliance/src/sender";
import {intake_router} from "../src";
import {FormDataRouter, formDataRouter} from "../src/form-data-router";

jest.mock("../src/form-data-router")
jest.mock("../src/intake-form-data")
jest.mock("pubsub_lalliance/src/sender")

describe("mainline", () => {
  functions.http('intake_router', intake_router);

  const formData: IntakeFormData = {
    area: "51", building: "", description: "", priority: "regular", reporter: "", rowIndex: 0, summary: "" + Math.random()
  }

  const publishConfig: PublishConfig = {
    project_id: "paperclip", topic_name: "advanced-aeronautics"
  }

  beforeEach(() => {
    // our mocks know how to handle rams
    process.env["PUBLISH_CONFIG"] = "ram"
  })

  const server = getTestServer("intake_router")

  test("happy path", async () => {
    const f = new MockFixture()
    const issueKey = "IssueKey-" + Math.random();
    f.formDataRouterMock.route.mockResolvedValue(issueKey)

    f.parseGoatAsFormData(formData);
    f.parseRamAsPublishConfig(publishConfig)

    const response = supertest(server).post("/").send("goat");
    await response.expect(200, issueKey)

    expect(f.senderFactory).toBeCalledWith(publishConfig)
    expect(f.formDataRouterMock.route).toBeCalledWith(expect.objectContaining(formData))
  })

  test("parse pubsub config or return 500", async () => {
    const f = new MockFixture()
    f.parseRamAsPublishConfig(publishConfig);
    process.env["PUBLISH_CONFIG"] = "wrong ram"

    const response = supertest(server).post("/").send("goat");

    await response.expect(500, "expected ram but got wrong ram")
  })

  test("parse error should return 400", async () => {
    const f = new MockFixture()
    f.parseIntakeFormDataMock.mockRejectedValue(TypeError("invalid"));

    const response = supertest(server).post("/").send("goat");
    await response.expect(400, "TypeError: invalid: goat")
    expect(f.formDataRouterMock.route).toBeCalledTimes(0)
  })

  test("routing error should return 500", async () => {
    const f = new MockFixture()
    f.parseGoatAsFormData(formData);
    f.formDataRouterMock.route.mockRejectedValue(new Error("no"))

    const response = supertest(server).post("/").send("goat");
    await response.expect(500, "Error: no")
  })

  class MockFixture {
    readonly formDataRouterMock = mock<FormDataRouter>();
    readonly parseIntakeFormDataMock = jest.mocked(parseIntakeFormData, true);
    readonly routerFactory = jest.mocked(formDataRouter, true);

    readonly senderMock = mock<Sender>();
    readonly parsePublishConfigMock = jest.mocked(parsePublishConfig, true);
    readonly senderFactory = jest.mocked(pubsubSender, true)

    constructor() {
      this.routerFactory.mockImplementation((jira, tickets, sender) => {
        if (sender !== this.senderMock) {
          throw new Error("Wrong sender sent to factory")
        }
        return this.formDataRouterMock
      })
      this.senderFactory.mockImplementation(() => {
        return this.senderMock;
      })
    }

    parseGoatAsFormData(formData: IntakeFormData): void {
      this.mockParsing("goat", formData, this.parseIntakeFormDataMock)
    }

    parseRamAsPublishConfig(publishConfig: PublishConfig): void {
      this.mockParsing("ram", publishConfig, this.parsePublishConfigMock)
    }

    private mockParsing<T>(input: any, parseResult: T, parserMock: jest.MockedFunctionDeep<any>): void {
      const errorOut: (actual: any) => T = (actual) => {
        throw new Error("expected " + input + " but got " + actual);
      };
      const mockDecoder = async (data: any) => data == input ? parseResult : errorOut(data);
      parserMock.mockImplementation(mockDecoder)
    }
  }
})
