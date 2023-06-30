import {setSendEndpoint, toJira, toJiraTestMode} from "../appscript/Code"
import {mockUrlFetchApp} from "./mock/http";
import {mockSheetsApp} from "./mock/sheets";
import {mockConfigurationViaThePropertiesService} from "./mock/properties";

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
      const urlFetch = mockUrlFetchApp(responseValues);

      toJiraTestMode("");

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
  })
})

test("property saving function", () => {
  const props = mockConfigurationViaThePropertiesService("foo")

  setSendEndpoint("foo")

  props.assertEndpointHasBeenSet()
})

export type Responses = ReturnType<typeof responses>

function responses(rowValues: string[]) {
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
