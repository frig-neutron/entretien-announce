# Maintenance intake scripts

Scripts that handle conversion of maintenance intake form responses into Jira tickets.

## Setup
 - Install `yarn`
 - `make init`
 - run `ENV=[stg|prd) ./deploy/deploy.sh`
 - configure the `FUNCTION_ENDPOINT` key to point the HTTP endpoint
   - by hand: `⚙️ Project Settings` > `Script Properties` > `Add script property`
   - by code: call `setSendEndpoint(url)` w/ clasp CLI (*FIXME: bork atm*)
 - set the `MODE` key to either of 
   - `production`: normal operations. Sends email, creates jira tickets.
   - `test`: prefixes all Jira tickets with `TEST - `
   - `noop`: don't create Jira tickets. Keep the `TEST - ` prefix. Still send email. 

## Manual Testing

Testing can be done on a [staging sheet](#staging). 

Using the staging sheet allows to you talk to the staging router function, which is deployed 
with a dummy email directory (to avoid bothering the neighbours). We only have one Jira instance,
so the "staging environment" doesn't fully isolate the users. That's where the `noop` mode comes in.

## Addresses of sheets
### Production
 - https://docs.google.com/spreadsheets/d/1bgp0tQi2P6-DLLpFbiABCHKHqIuhnrjk0hxB_sw89iQ/
 - `{"scriptId":"1gZTpx-4gctx_bZov63w9VdWQA4BrnjYDqubuFKuxjdLguK5AJ4K6R5IO"}`
 - [The form](https://docs.google.com/forms/d/1VHfdRTX7tatG00jd66SQ5-GFETA8CX0P3J_achIfRY4/edit)
### Staging 
 - https://docs.google.com/spreadsheets/d/16IHfZfz8KI7YCd0hANXyJFWZGvSKTVdAwf1zV_4_rhQ/
 - `{"scriptId":"1zASoko5C5ko9vs4YzgHvPoGA7_iaFLZ1skNfPr6bURoC2V_fhQ907iNd"}`

## Troubleshooting 
 - ticket responses are processed on the log sheet 
 - after successful filing a log entry is put in place
 - to reprocess stuff, delete the log entry and rerun the script
 - Ubuntu `yarn` package is not what you want. You want `yarnpkg`
