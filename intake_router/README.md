# Intake router

This component receives notification of maintenance submissions.

- It is notified by HTTP via Google Apps Script, so it's NOT a pubsub function.
- Don't give it pubsub input.

## Operational

### Parameters

The only param is the actual form submission:

```json
{
  "area": "apartment",
  "building": "1234",
  "priority": "regular",
  "reporter": "guest",
  "rowIndex": 666,
  "summary": "this is test issue",
  "description": "test description.",
  "mode": "noop"
}
```

The `mode` field is a configuration option. It can take the values

- `production`: work normally. Create tickets, send notifications.
- `test`: Prepend "TEST" to most strings. Supports manual integration testing.
- `noop`: Don't talk to Jira. Log ticket content instead of filing them.
  Supports screwing around w/o cluttering up jira.

### Configuration

Configuration done using environment variables.
todo: validate how this affects [announcer][announcer]

* `SECRETS`: Injected from GCP secret manager. Shares a secret with the other functions.
  ```json5
  // Caveat: since the secret is shared, there could be other keys
  {
      jira_email: "string",
      jira_token: "string"
  }
  ```

* `JIRA_OPTIONS`: The less secret parts of Jira config. Not sure why I decided to split this
  from the main secrets.
  ```json5
  {
    jira_host: "https://my-jira.atlassian.net",
    jira_intake_project_key: "PROJ" 
  }
  ```

* `PUBLISH_CONFIG`: where to send emails
  ```json
  {
      "topic_name": "email topic",
      "project_id": "gcp project containing topic"
  }
  ```

* `DIRECTORY` - coop members. Almost same format as [monthly report function][announcer].

  The directory is used to look up the username of the recipient of a ticket notification.
  In frig-neutron/entretien-intake/issues/20 this will be useful to locate the email of the ticket
  submitter.

  ```json 
  [
    {"lang": "en", "name": "Daniil", "email": "daniils.email@gmail.com", "roles": []},
    {"lang": "fr", "name": "Charlie", "email": "charlies.email@gmail.com", "roles": []}
  ]
  ```

  The possible roles are: `BR_3735`, `BR_3737`, `BR_3739`, `BR_3743`, `BR_3745`, `TRIAGE`, `ADMIN`

There's this concept of "priority" which doesn't affect anything about the routing, but _does_
affect email rendering. If a person is both a "Building rep" and an "Urgent" responder then how do
you address them in the notification and which email do you choose to send? To resolve the
question, I'm treating priority as descending from top to bottom - that is roles listed lower
down override roles listed above.

The `ADMIN` role is only used for testing, atm. If a message is being processed in test mode (i.
e.: with `mode` set to either `noop` or `test`), then the outgoing message recipent email is 
transformed into `<admin-local-part>+test-<original-recipient-local-part>@gmail.com`. I say at 
gmail.com b/c the `+-in-the-local-part` trick is Gmail specific. 

## Testing

### Local testing

- Running locally can be done w/ the `functions-framework`.
- Use the script command `function-watch`
- Send events with 
  ```bash
    echo ' ... get sample json above ...' | curl -XPOST -d @- localhost:8080
  ```
    - The `functions-framework` `--signature-type=event` parameter makes it only listen to HTTP
      POST, which is why it's a post. Removing the signature type makes it accept HTTP GET, but then
      it just hangs there. I think this is because it expects a response on the 2nd function param.

### Manual testing

#### Staging environment
Testing in the STG env has 2 levers:

- the `DIRECTORY`, which allows you to not bother the neighbours with email
- [appscript][appscript] `MODE` config key redirects all email to the first user having `ADMIN`, 
  and in addition: 
  - suppresses ticket creation (`MODE=noop`) or 
  - creates the ticket, but both ticket + email (`MODE=test`).

#### Prod environment
Testing in PRD env has just 1 lever: 

To test in prod, manually set the `MODE` config key in the script configuration  to `noop` or 
`test`. Either one of those will redirect email to the admin, but `noop` will also prevent 
tickets from being created.


[announcer]: ../announcer

[appscript]: ../intake_form
