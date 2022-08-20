import {getTestServer} from "@google-cloud/functions-framework/build/src/testing";

import supertest from "supertest";
import * as functions from "@google-cloud/functions-framework";
import {mock} from "jest-mock-extended";
import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {intake_router} from "../src";
import {FormDataRouter, formDataRouter} from "../src/form-data-router";

jest.mock("../src/form-data-router")
jest.mock("../src/intake-form-data")

describe("mainline", () => {
  functions.http('intake_router', intake_router);

  const formData: IntakeFormData = {
    area: "51", building: "", description: "", priority: "regular", reporter: "", rowIndex: 0, summary: "" + Math.random()
  }

  const server = getTestServer("intake_router")

  test("happy path", async () => {
    const f = new MockFixture()
    const issueKey = "IssueKey-" + Math.random();
    f.formDataRouterMock.route.mockResolvedValue(issueKey)

    f.parseGoatAsFormData(formData);

    const response = supertest(server).post("/").send("goat");
    await response.expect(200, issueKey)
    expect(f.formDataRouterMock.route).toBeCalledWith(expect.objectContaining(formData))
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

    constructor() {
      this.routerFactory.mockImplementation(() => {
        return this.formDataRouterMock
      })
    }

    parseGoatAsFormData(formData: IntakeFormData) {
      const decodeGoatAsFormData = async (data: any) => data == "goat" ? formData : mock<IntakeFormData>();
      this.parseIntakeFormDataMock.mockImplementation(decodeGoatAsFormData)
    }
  }
})
