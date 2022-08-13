import {getTestServer} from "@google-cloud/functions-framework/build/src/testing";

import supertest from "supertest";
import * as functions from "@google-cloud/functions-framework";
import {mock} from "jest-mock-extended";
import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {intake_router} from "../src";
import {FormDataRouter, formDataRouter,} from "../src/form-data-router";

jest.mock("../src/form-data-router")
jest.mock("../src/intake-form-data")

describe("mainline", () => {
  functions.http('intake_router', intake_router);

  const formDataRouterMock = mock<FormDataRouter>()
  const parseIntakeFormDataMock = jest.mocked(parseIntakeFormData, true)
  const routerFactory = jest.mocked(formDataRouter, true)
  routerFactory.mockImplementation(() => {
    return formDataRouterMock

  })
  test("happy path", async () => {
    const formData: IntakeFormData = {
      area: "51", building: "", description: "", priority: "", reporter: "", rowIndex: 0, summary: ""
    }

    const decodeGoatAsFormData = (data: any) => data == "goat" ? formData: mock<IntakeFormData>();
    parseIntakeFormDataMock.mockImplementation(decodeGoatAsFormData)

    const server = getTestServer("intake_router")

    await supertest(server).post("/").send("goat").expect(200)
    expect(formDataRouterMock.route).toBeCalledWith(expect.objectContaining(formData))
  })
})
