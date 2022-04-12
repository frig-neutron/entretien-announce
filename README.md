# Entretient Announcer

Announce Jira ticket activity to groups of users

## Setting Started

Terraform

    gcloud auth application-default login so terraform works

Git crypt (one time)

    git-crypt init
    git-crypt add-gpg-user 22BD951E6D487BFE5371FD432E91B6B62DE72DBC

The `.gitattributes` file in the secrets dir makes `git-crypt` crypt

Useful git-crypt commants

    git-crypt lock 
    git-crypt unlock 
    git-crypt status 

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
