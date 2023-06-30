import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
import HttpHeaders = GoogleAppsScript.URL_Fetch.HttpHeaders;
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;

let inTestMode = false
let testModePrefix = ""

let responsesSheet: Sheet
let logSheet: Sheet

let columnIndex: { [k: string]: number }
let jiraBasicAuthToken: string
const jiraPriorityUrgent = "urgent"
const jiraPriorityRegular = "regular"
const functionEndpontConfigKey = "FUNCTION_ENDPOINT"

const responseFieldLabels: { [label: string]: string } = {
  building: "Bâtiment",
  element: "Elément",
  description: "Description",
  area: "Zone",
  reportedBy: "Rapporté par",
  priority: "Priorité"
}

/**
 * Delayed init or unit tests won't run b/c of missing symbols
 */
function init() {
  responsesSheet = requireSheetByName("Form responses 1")
  logSheet = requireSheetByName("state-of-affairs");
  columnIndex = indexResponseFields()
}

function requireSheetByName(name: string): Sheet {
  const requiredSheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!requiredSheet) {
    throw `Required sheet '${name}' not found`
  }
  return requiredSheet
}

class TicketContext {
  formData: FormData
  rowIndex: number
  sendResponse: HTTPResponse | null = null
  jiraTicketKey: any

  constructor(formData: FormData) {
    this.formData = formData
    this.rowIndex = formData.rowIndex
  }
}

// todo: share w/ intake router form struct?... someday, maybe? 🥺
export interface FormData {
  rowIndex: number
  building: string
  summary: string
  description: string
  area: string
  reporter: string
  priority: "regular" | "urgent"
  mode: "production" | "test" | "noop"
}

// ENTRY POINT
// noinspection JSUnusedLocalSymbols
function toJira(e: any) {
  inTestMode = false
  testModePrefix = ""
  run();
}

function run() {
  init()
  let numRows = responsesSheet.getLastRow();
  let dataRange = responsesSheet.getRange(2, 1, numRows - 1, responsesSheet.getLastColumn())

  const rowOffset: number = 2 // 1 for header & 1 for starting count from 1
  const tickets: TicketContext[] = dataRange.getValues().
    map((r, i) => unpackFormData(r, i + rowOffset)).
    map((f) => new TicketContext(f))

  sendAll(tickets);
}

function unpackFormData(rowData: string[], rowIndex: number): FormData {
  function rowFieldValue(fieldName: string) {
    return rowData[columnIndex[fieldName]]
  }

  function mapFormToJiraPriority(formPriorityValue: string) {
    if (formPriorityValue.startsWith("Urgent")) {
      return jiraPriorityUrgent
    } else {
      return jiraPriorityRegular
    }
  }

  return {
    rowIndex: rowIndex,
    building: rowFieldValue(responseFieldLabels.building),
    summary: testModePrefix + rowFieldValue(responseFieldLabels.element),
    description: testModePrefix + rowFieldValue(responseFieldLabels.description),
    area: rowFieldValue(responseFieldLabels.area),
    reporter: rowFieldValue(responseFieldLabels.reportedBy),
    priority: mapFormToJiraPriority(rowFieldValue(responseFieldLabels.priority)),
    mode: inTestMode ? "test" : "production"
  }
}

// ENTRY POINT FOR TEST MODE
// noinspection JSUnusedLocalSymbols
function toJiraTestMode(e: any) {
  inTestMode = true
  testModePrefix = "TEST - "
  run()
}

function indexResponseFields(): { [k: string]: number } {
  const headerValues: string[] = getHeaderValues()
  return indexFields(headerValues);
}

function getHeaderValues(): string[] {
  let nCols = responsesSheet.getLastColumn()
  let headerRange = responsesSheet.getRange(1, 1, 1, nCols)
  return headerRange.getValues()[0]
}

// return {fieldName: columnIndex} object
function indexFields(headerRow: string[]): { [k: string]: number } {
  const entries = new Map(headerRow.map((e, i) => [e, i]))
  return Object.fromEntries(entries)
}

// input is [TicketContext, ...]
function sendAll(tickets: TicketContext[]) {
  tickets.map(ticketContext => sendAndMark(ticketContext))
}

function sendAndMark(ticketContext: TicketContext) {
  if (notAlreadySent(ticketContext.rowIndex)) {
    ticketContext.sendResponse = sendOne(ticketContext)
    markSent(ticketContext)
  }
}

function notAlreadySent(ticketRowIndex: number) {
  let timestampValue = logSheet.getRange(ticketRowIndex, 1).getValue();
  return timestampValue === "";
}

function sendOne(ticketContext: TicketContext): HTTPResponse {
  const payload: string = JSON.stringify(ticketContext.formData);
  const url = PropertiesService.getScriptProperties().getProperty(functionEndpontConfigKey)
  if (!url) {
    throw "Ticket endpoint URL not found"
  }
  const headers: HttpHeaders = {
    "contentType": "application/json",
    "Accept": "application/json",
    "authorization": "Basic " + jiraBasicAuthToken
  };

  const options: URLFetchRequestOptions = {
    "contentType": "application/json",
    "method": "post",
    "headers": headers,
    "payload": payload
  };

  return UrlFetchApp.fetch(url, options);
}

function markSent(ticketContext: TicketContext) {
  let issueKey = ticketContext.sendResponse ? ticketContext.sendResponse.getContentText() : ""
  ticketContext.jiraTicketKey = issueKey
  let ticketRowIndex = ticketContext.rowIndex
  mark(ticketRowIndex, 1, new Date().toISOString())
  mark(ticketRowIndex, 2, issueKey)

}

function mark(ticketRowIndex: number, columnIndex: number, value: any) {
  logSheet.getRange(ticketRowIndex, columnIndex).setValue(value)
}

/**
 * Configure script with function endpoint. This is an administrative function, intended
 * to be called from CLASP during deployment.
 */
function setSendEndpoint(url: string){
  PropertiesService.getScriptProperties().setProperty(functionEndpontConfigKey, url)
}

export {toJira, toJiraTestMode, setSendEndpoint, responseFieldLabels, functionEndpontConfigKey}
