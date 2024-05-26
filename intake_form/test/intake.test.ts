import {setSendEndpoint, toJira} from "../appscript/Code"
import {mockUrlFetchApp} from "./mock/http";
import {mockSheetsApp} from "./mock/sheets";
import {mockPropertiesServiceFunctionEndpoint, mockPropertiesServiceModeKey} from "./mock/properties";

describe("intake end-to-end", () => {

  describe("urgent", () => {
    const responseValues = responses([
      "28/03/2021 16:01:17",
      "L'eau chaude ne marche pas",
      "3737",
      "Sous-sol",
      "Urgent (à régler dans les prochaines 24 heures / to be repaired in the next 24 hours)",
      "A. Member",
      "chauffe-eau"
    ])

    test("urgent", () => {
      mockPropertiesServiceModeKey("production")
      const sheets = mockSheetsApp(responseValues)
      const urlFetch = mockUrlFetchApp(responseValues);

      const timestampLike = /....-..-..T..:..:..\....Z/;

      toJira(null);

      sheets.logSheet.assertJiraIssueKeySetTo(urlFetch.issueKey)
      sheets.logSheet.assertProcessTimestampMatches(timestampLike)

      urlFetch.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "chauffe-eau",
        mode: "production"
      })
    })
    test("Test-mode", () => {
      mockSheetsApp(responseValues)
      mockPropertiesServiceModeKey("test")
      const urlFetch = mockUrlFetchApp(responseValues);

      toJira("");

      urlFetch.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "TEST - L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "TEST - chauffe-eau",
        mode: "test"
      })
    })
    test("Noop-mode", () => {
      mockSheetsApp(responseValues)
      mockPropertiesServiceModeKey("noop")
      const urlFetch = mockUrlFetchApp(responseValues);

      toJira("");

      urlFetch.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "TEST - L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "TEST - chauffe-eau",
        mode: "noop"
      })
    })
  })

  describe("non-urgent", () => {
    const responseValues = responses([
      "28/03/2021 16:01:17",
      "L'eau chaude ne marche pas",
      "3737",
      "Sous-sol",
      "Régulier (ça peut être régler dans plus de 24 heures / can be solved in more that 24 hours)",
      "A. Member",
      "chauffe-eau"
    ])

    test("End to end, non-urgent", () => {
      mockPropertiesServiceModeKey("production")
      mockSheetsApp(responseValues)
      const urlFetch = mockUrlFetchApp(responseValues);

      toJira(null);

      urlFetch.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "regular",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "chauffe-eau",
        mode: "production"
      })
    })
    test("retry http errors", () => {
      mockPropertiesServiceModeKey("production")
      mockSheetsApp(responseValues)
      const urlFetch = mockUrlFetchApp(
          responseValues,
          "Request failed for https://cloudfunctions.net returned code 500"
      );

      toJira(null);

      urlFetch.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "regular",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "chauffe-eau",
        mode: "production"
      })
    })

    test("http error retry limit", () => {
      mockPropertiesServiceModeKey("production")
      mockSheetsApp(responseValues)
      const urlFetch = mockUrlFetchApp(
          responseValues,
          "Request failed for https://cloudfunctions.net returned code 500",
          "Request failed for https://us-central1.cloudfunctions.net returned code 429. Truncated server response: Rate exceeded",
          "What now?",
      );

      let diedWithException = true;
      try {
        toJira(null);
        diedWithException = false;
      } catch ({message}) {
        expect(message).toContain("What now?")
      }
      expect(diedWithException).toBe(true)
    })
  })

  describe("invocation validation", () => {
    test("invalid mode", () => {
      mockPropertiesServiceModeKey("INVALID")
      expect(() => toJira(null)).toThrow("invalid mode: INVALID")
    })
    test("null mode", () => {
      mockPropertiesServiceModeKey(undefined)
      expect(() => toJira(null)).toThrow("invalid mode: undefined")
    })
    test("numbers should be converted to strings", () => {
      // GSheets gets numerical values as numbers, but the downstream expects everything to be a string
      const responseValues = responses([
        0, 1, 2, 3, "something", 5, 6 // numerical responses can only happen on bldg, but I'm testing everywhere
      ])
      mockPropertiesServiceModeKey("production")
      mockSheetsApp(responseValues)

      const urlFetch = mockUrlFetchApp(responseValues);

      toJira(null);

      urlFetch.assertTicketCreated({
        area: "3",
        building: "2",
        description: "1",
        priority: "regular",
        reporter: "5",
        rowIndex: 2,
        summary: "6",
        mode: "production"
      })
    })
  })
})

test("property saving function", () => {
  const props = mockPropertiesServiceFunctionEndpoint("foo")

  setSendEndpoint("foo")

  props.assertEndpointHasBeenSet()
})

export type Responses = ReturnType<typeof responses>

function responses(rowValues: any[]) {
  const responseColumns = ["Timestamp", "Description", "Bâtiment", "Zone", "Priorité", "Rapporté par", "Elément"]

  return {
    responseValue(column: string) {
      return Object.fromEntries(
          responseColumns.map((e, i) => [e, rowValues[i]])
      )[column]
    },
    nColumns: rowValues.length,
    headerRow: responseColumns,
    rowValues: rowValues
  }
}
