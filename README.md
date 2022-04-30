# Entretient Announcer

Announce Jira ticket activity to groups of users

## Setting Started

### Terraform

    gcloud auth application-default login so terraform works

### Git crypt (one time)

    git-crypt init
    git-crypt add-gpg-user 22BD951E6D487BFE5371FD432E91B6B62DE72DBC

The `.gitattributes` file in the secrets dir makes `git-crypt` crypt

Useful git-crypt commants

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

[announcer-code]: ./announcer
[announcer-invariant-config]: ./announcer/README.md#configuration
[announcer-runtime-config]: ./announcer/README.md#parameters
[node-gotchas]: ./doc/node-gotchas.md
[nvm]: https://github.com/nvm-sh/nvm
[sendmail-code]: ./sendmail
