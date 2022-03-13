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

## Secret storage stragegy

Since we're only using one set of production creds (jira, gmail) I'm going to go simple and just
encrypt the whole TF secrets varfile. This implies that to use Terraform you need to
unlock `git-crypt`.

## Report structure

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
