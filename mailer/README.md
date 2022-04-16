# Mailer Function

This component reads messages from Pubsub and sends them out via SMTP.

## Functional

Each Pubsub message contains one email. Failure to send causes function failure.

## Operational

### Parameters

Invocation parameters contain the email to send, described in
the [announcer output message][announcer-readme-output] format.

### Configuration

Configuration done using environment variables.

* `MAILER_SECRETS`: SMTP secret values. Example
  ```json
  {
    "smtp_from":"who-the-messages-come-from@gmail.com",
    "smtp_host":"smtp.gmail.com",
    "smtp_password":"GMAIL_APPLICATION_PASSWORD",
    "smtp_username":"owner-of-the-gmail-account@gmail.com"
  }
  ```

### Local testing

Running locally can be done w/ the `functions-framework`. Use the script command. The
`--signature-type=event` makes it only listen to HTTP POST, so `curl -XPOST localhost:8080`.
Removing the signature type makes it accept HTTP GET, but then it just hangs there. I think this is
because it expects a response on the 2nd function param.

[announcer-readme-output]: ../announcer/README.md#output
