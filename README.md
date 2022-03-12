# entretien-announce
Announce Jira ticket activity to groups of users


## getting started
Terraform

> gcloud auth application-default login so terraform works

Git crypt

> git-crypt init

One time: 
> git-crypt add-gpg-user 22BD951E6D487BFE5371FD432E91B6B62DE72DBC

The `.gitattributes` file in the secrets dir makes `git-crypt` crypt

Useful git-crypt commants

> git-crypt lock 
> git-crypt unlock 
> git-crypt status 

## Secret storage stragegy 

Since we're only using one set of production creds (jira, gmail) I'm going to
go simple and just encrypt the whole TF secrets varfile.

