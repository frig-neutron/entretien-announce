# Announcer Function

This component queries jira and produces announcements for a directory of recipients.

The number of announcements == number of recipients.

## Functional 
### Report structure

The plan is to have 2 types of reports: a detailed report for the members of the maintenance
committee, and a privacy-preserving summary report for everyone else. The summary report should
probably be aggregated at building granularity.

The report covers one month. For example if the announcer is triggered on the 2nd of the month then
the report will cover the whole previous month. With this in mind, the report should be sent out
early in the month.

In both reports, the headings are:

* New tickets
* All open tickets
* Tickets in progress (where in progress is defined as "not in backlog and not done")
* Tickets closed during the previous month

## Operational
### Parameters

Invocation parameters are supplied via the trigger message.
Supported parameters are: 

```json5
{
  "dry_run": true,   // Publish dry_run announcements (TODO)
}
```

### Output

The announcer publishes messages to the `sendmail` topic. The message format is 

```json5
{
  "primaryRecipient": "recipient@example.com",
  "secondaryRecipients": ["bcc_recipient@example.com"],
  "subject": "...",
  "body": "...", 
  "dry_run": true // log but don't send the message (TODO)
}
```

### Configuration

Configuration done using environment variables.

* `ANNOUNCER_SECRETS`: Jira secret values. Example
  ```json
  {
    "jira_email":"just-another-jira-user@gmail.com",
    "jira_token":"JIRA_API_TOKEN"
  }
  ```
* `DIRECTORY`: List of recipient directory entries. The `role` field will control the amount of
  report detail that the individual users will see. Not sure what the possible values will be - I'm
  thinking of just 2: `JIRA_USER` and `MEMBER`.
    * Jira users will get full detail, since they can go into jira themselves and just get the
      information. The reports will contain link to Jira, which they can access
    * "Member" users will get privacy-preserving aggregates at building granularity.
    ```json 
    [
      {"name": "Daniil", "email": "daniils.email@gmail.com", "lang": "en", "roles": []},
      {"name": "Charlie", "email": "charlies.email@gmail.com", "lang": "fr", "roles": []},
    ]
    ```

### Local testing

Running locally can be done w/ the `functions-framework`. Use the script command. The
`--signature-type=event` makes it only listen to HTTP POST, so `curl -XPOST localhost:8080`.
Removing the signature type makes it accept HTTP GET, but then it just hangs there. I think this is
because it expects a response on the 2nd function param.

## Technical
### Localization

- done using the [`typesafe-i18n`][typesafe-i18n] lib
- requires a generator. The generator watches files of interest, unless you specify --no-watch
  (check `package.json` for script details)
  
## ADR

### Handlebars

Tried templating w/ Handlebars. Turned out a no-go b/c of localization requirement. The report model
doesn't include localized strings. I _could_ include them, but then I'd have to be aware of the
language of the report at the time of the report creation, which doesn't work with the report being
language-agnostic. In my mind I'd like to introduce language at the rendering phase, and not before.

Other thing that I reject was crating a handlebars `{{l key="stringKey"}}` helper as an adaptor for
the `typesafe-i18n` `L` object. This would cost me localization type safety, since all the calls
would be dynamic. After all this effort learning `typesafe-i18n` I'd prefer to stay with typesafe
localizations.

The hybrid solution suffers from the same drawback: I _could_ include localization keys on the
`ReportModel` classes, but that also loses type-safety.

I also considered re-wrapping the `ReportModel` with a sort of deep-decorator. The re-wrapping would
be done at render time. I was thinking of producing an object tree containing all the
`ReportModel` attributes which would contain localized strings, and feed _that_ into the Handlebars
template, but it seems like too much work compared to the alternative:

The alternative is directly buidling HTML using a fluent builder. This requires all the same work as
re-wrapping the report model, only at the end you're left with a direct HTML representation, and not
a data object that needs _another_ level of templating. For now I'm using basic JS templates...
because I didn't find anything better.


[typesafe-i18n]: https://github.com/ivanhofer/typesafe-i18n
