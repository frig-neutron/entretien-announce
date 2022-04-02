/**
 * Simplified interface to issue from jira.js
 */
import {Issue} from "jira.js/out/version2/models";
import {DateTime, Duration, Interval} from "luxon";
import {Option} from "prelude-ts";

export interface JiraTicket {
  key(): string

  building(): string,

  summary(): string

  dateCreated(): Option<DateTime>

  age(): Option<Duration>
  // todo: add "date created" / "age"
  // todo: add "creator", parsing from ticket body
  // todo: add "status" and "resolution"
}

export interface Clock {
  time: () => DateTime
}

const defaultClock: Clock = {
  time: (): DateTime => DateTime.now()
}

export function proxyJiraJsIssue(issue: Issue, clock = defaultClock): JiraTicket {

  const value = (maybeField: any): string | undefined => {
    if (maybeField && maybeField.value) {
      return maybeField.value
    } else {
      return undefined
    }
  }

  const parseBuilding = (): string => {
    const buildingFromField = value(issue.fields.customfield_10038);
    const summary = issue.fields.summary;
    if (buildingFromField) {
      return buildingFromField
    } else {
      const bldgRe = /^([0-9]+).*/
      if (summary) {
        const match = summary.match(bldgRe)
        if (match) {
          return match[1]
        }
      }
      return "unknown"
    }
  }

  const parseDateTime = (): Option<DateTime> => {
    const parsed = DateTime.fromISO(issue.fields.created);
    return  parsed.isValid ? Option.of(parsed) : Option.none();
  };
  const ticketLifeInterval = () => parseDateTime().map(dt => Interval.fromDateTimes(dt, clock.time()))

  return {
    age: () => ticketLifeInterval().map(i => i.toDuration()),
    dateCreated: parseDateTime,
    key: () => issue.key,
    building: () => parseBuilding(),
    summary: () => issue.fields.summary
  }
}
