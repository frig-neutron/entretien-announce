import {toJira, toJiraTestMode} from "../appscript/Code"
import {mockJira} from "./mock/http";
import {mockSheetsApp} from "./mock/sheets";

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
      const jira = mockJira(responseValues);

      const timestampLike = /....-..-..T..:..:..\....Z/;

      toJira(null);

      sheets.logSheet.assertJiraIssueKeySetTo(jira.issueKey)
      sheets.logSheet.assertProcessTimestampMatches(timestampLike)

      jira.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "chauffe-eau"
      })
    })
    test("Test-mode", () => {
      mockSheetsApp(responseValues)
      const jira = mockJira(responseValues);

      toJiraTestMode("");

      jira.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "TEST - L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "TEST - chauffe-eau"
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
      const jira = mockJira(responseValues);

      toJira(null);

      jira.assertTicketCreated({
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "regular",
        reporter: "A. Member",
        rowIndex: 2,
        summary: "chauffe-eau"
      })
    })
  })
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
