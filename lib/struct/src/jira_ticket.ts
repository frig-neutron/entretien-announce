import {DateTime, Duration} from "luxon";
import {Option} from "prelude-ts";

export interface JiraTicket {
  age(): Option<Duration>
  building(): string, // TODO: most things are option
  dateCreated(): Option<DateTime>
  key(): string
  status(): Option<string>
  summary(): string
}
