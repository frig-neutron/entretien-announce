# Gmail response scanner

Scripts that periodically check for new email replies to notifications sent from announcer,
triggering a GCF if one is found.

## Setup

- Install `pnpm`
- `make init`
- run `ENV=[stg|prd) ./deploy/deploy.sh`
- configure the `FUNCTION_ENDPOINT` key to point the HTTP endpoint
    - by hand: `⚙️ Project Settings` > `Script Properties` > `Add script property`
    - by code: call `setSendEndpoint(url)` w/ clasp CLI (*FIXME: bork atm*)
- set the `MODE` key in script configuration to `production`

## Operation principle

- wake up every N minutes on a timed
  trigger, [subject to limits](#wakeup-frequency--processing-time)
- search for replies to notifications that do not have the "received" label attached.
- for each such message, attach "in-progress" label
- produce event to GCF HTTP endpoint
- replace "in-progress" label with "received"

## [Limits][quotas-and-limits]

GAS resource limits (for non-workspace customers)

- Triggers total runtime: 90 min / day
- Script runtime: 6 min / execution
- Simultaneous executions per user: 30 / user
- Apps Script projects: 50 / day

Quotas are per user and reset 24 hours after the first request

The biggest limiter is the 90-minute total runtime, placing an upper limit on the min
runtime.

| Response time | Executions / 24h | Max runtime |
|---------------|------------------|-------------|
| 5 min         | 288              | 18s         |
| 10 min        | 144              | 22s         |
| 15 min        | 96               | 56s         |

That's if runtime is uniform, though. Most executions will wake up the script, see that there's 
nothing to do, and shut down. Occasionally it will have to call out to GCF, which takes about 30s. 

Conclusion: 5m wakeup schedule could be feasible.

## Addresses of scripts
### Production
- https://script.google.com/d/1oLa9skBGGYo1MP11I0lAL3h42hz4BLM7PtiFH5cSl-ZekD9cpBIIJ-FT/edit
- `{"scriptId":"1oLa9skBGGYo1MP11I0lAL3h42hz4BLM7PtiFH5cSl-ZekD9cpBIIJ-FT"}`
### Staging
- https://script.google.com/d/19VHS408PfXrd9MMFYc7jSaUBGYjyaYy0_z64CwnMsM_Ysruz3D8pwlgp/edit
- `{"scriptId":"19VHS408PfXrd9MMFYc7jSaUBGYjyaYy0_z64CwnMsM_Ysruz3D8pwlgp"}`


[quotas-and-limits]: https://developers.google.com/apps-script/guides/services/quotas
