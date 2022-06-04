# Entretien Announcer

Announce Jira ticket activity to groups of users

## Setting Started

### Terraform

    gcloud auth application-default login so terraform works

### Git crypt (one time)

    git-crypt init
    git-crypt add-gpg-user 22BD951E6D487BFE5371FD432E91B6B62DE72DBC

The `.gitattributes` file in the secrets dir makes `git-crypt` crypt

Useful git-crypt commands

    git-crypt lock 
    git-crypt unlock 
    git-crypt status 

###NodeJS

Install using [nvm][nvm]. Don't use the OS package manager version.

    nvm install 17
    nvm use 17

Node-related technical issues described in [node-gotchas][node-gotchas].

## Deployment

TBD, yo

## Components

See [C4 container diagram](./doc/c4-container.puml) for a visual reference.

### [Announcer][announcer-code]

Implements the business logic. 

Inputs:
- Trigger by pubsub message on `announcer_trigger` topic. A Cloud Scheduler Job emits the 
  triggering message. Under normal operation the message is empty, but can contain [runtime 
  parameters for special invocation behaviour][announcer-runtime-config].
- Tickets fetched from Jira instance.
- Secrets and user directory configured via [environment variables][announcer-invariant-config].

Outputs:
- Publishes rendered, addressed messages to `sendmail` topic.

### [Sendmail][sendmail-code]

Takes care of delivering rendered, addressed reports to the recipient.

Inputs:
- Message content comes from subscription on `sendmail` topic
- SMTP credentials come from env var injected from GCP `announcer` secret. 

Outputs:
- Sends email via SMTP server (gmail).

## Secret storage strategy

Since we're only using one set of production creds (jira, gmail) I'm going to go simple and just
encrypt the whole TF secrets varfile. This implies that to use Terraform you need to
unlock `git-crypt`.

We're also storing the user directory files at `./announcer/deploy/directory*json` encrypted. 
Those files content goes into the function deployment string, so they're not gcp secrets. 
Technically the jira/gmail creds could have been deployed in the same way.

## GCP infra

Using 2 environments: stg/prd.

* Staging env goes to `entretien-stg` project.
* Production env goes to `entretien-prd` project.

Project state is stored in TF workspaces. 

* The production workspace is `prd`, 
* The staging workspace is `stg`
* The default workspace exists, but is unused

Applying terraform plans can be done in one of two ways:

    terraform workspace select stg
    terraform apply

..or in one shot:

    TF_WORKSPACE=stg terraform plan apply

## Local dev

The source of all that is [true][functions-library]

### [Calling][functions-local-call]

`.data` section [event definition][function-trigger-pubsub-event]. 

Example:
```shell
# 'world' base64-encoded is 'd29ybGQ='
curl localhost:8080 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "context": {
          "eventId":"1144231683168617",
          "timestamp":"2020-05-06T07:33:34.556Z",
          "eventType":"google.pubsub.topic.publish",
          "resource":{
            "service":"pubsub.googleapis.com",
            "name":"projects/sample-project/topics/gcf-test",
            "type":"type.googleapis.com/google.pubsub.v1.PubsubMessage"
          }
        },
        "data": {
          "@type": "type.googleapis.com/google.pubsub.v1.PubsubMessage",
          "attributes": {
             "attr1":"attr1-value"
          },
          "data": "d29ybGQ="
        }
      }'
    
```
### Running

#### Option: [node][functions-local-run-node]

Supported in both `package.json`

    npm run function 

#### Option: docker

(y tho?)

Build image

    pack build 
    --builder gcr.io/buildpacks/builder:v1 \
    --env GOOGLE_FUNCTION_SIGNATURE_TYPE=http \
    --env GOOGLE_FUNCTION_TARGET=helloWorld \
    function_name

Run in docker

    docker run --rm -p 8080:8080 my-first-function

## Testing 

https://cloud.google.com/functions/docs/testing/test-overview

[announcer-code]: ./announcer
[announcer-invariant-config]: ./announcer/README.md#configuration
[announcer-runtime-config]: ./announcer/README.md#parameters
[cloud-event]: https://cloud.google.com/functions/docs/running/calling#cloudevent_functions
[functions-library]: https://cloud.google.com/functions/docs/running/overview
[functions-local-call]: https://cloud.google.com/functions/docs/running/calling#background_functions
[functions-local-run-node]: https://cloud.google.com/functions/docs/running/function-frameworks#per-language_instructions
[function-trigger-pubsub-event]: https://cloud.google.com/functions/docs/calling/pubsub#event_structure
[node-gotchas]: ./doc/node-gotchas.md
[nvm]: https://github.com/nvm-sh/nvm
[sendmail-code]: ./sendmail
