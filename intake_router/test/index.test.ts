import {getTestServer} from "@google-cloud/functions-framework/build/src/testing";

import supertest from "supertest";
import * as functions from "@google-cloud/functions-framework";
import {mock} from "jest-mock-extended";

jest.mock("../src/form-data-router")

import {IntakeFormData} from "../src/intake-form-data";

import {intake_router} from "../src";


import {FormDataRouter, formDataRouter} from "../src/form-data-router";

describe("mainline", () => {
  functions.http('intake_router', intake_router);

  const formDataRouterMock = mock<FormDataRouter>()
  const routerFactory = jest.mocked(formDataRouter, true)
  routerFactory.mockImplementation(() => {
    return formDataRouterMock
  })

  test("happy path", async () => {
    const formData: IntakeFormData = {
      area: "", building: "", description: "", priority: "", reporter: "", rowIndex: 0, summary: ""
    }

    const server = getTestServer("intake_router")

    await supertest(server).post("/").send(JSON.stringify(formData)).expect(200)

    expect(routerFactory).toBeCalledTimes(1)
    expect(formDataRouterMock.route).toBeCalledWith(expect.objectContaining(formData))
  })
})
