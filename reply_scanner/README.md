# Gmail response scanner

Scripts that periodically check for new email replies to notifications sent from announcer,
triggering a GCF if one is found.

## Setup

- Install `pnpm`
- `make init`
  - this prompts OAuth. Annoyingly, clasp keeps its token in a global home location. Since the 
    intake form is using a different account that means you have to re-login when switching 
    between scripts belonging to different accounts.
- You might need to enable apps script API by visiting https://script.google.com/home/usersettings
- run `ENV=[stg|prd) ./deploy/deploy.sh`
- configure the `FUNCTION_ENDPOINT` key to point the HTTP endpoint
    - by hand: `⚙️ Project Settings` > `Script Properties` > `Add script property`
    - by code: call `setSendEndpoint(url)` w/ clasp CLI (*FIXME: bork atm*)
- set the `MODE` key in script configuration to `production`
- set the `ROBOT_EMAIL` key in script configuration to the robot's actual email address.

## Operation principles

- wake up every N minutes on a timed
  trigger, [subject to limits](#limitsquotas-and-limits)
- search for `in:Inbox -label:automation/event_sent -label:automation/irrelevant` threads
    - if message contains ticket info, queue up operation to 
        - produce event to GCF HTTP endpoint, and
        - label with `automation/event_sent`
    - else, 
      - synchronously mark with `-label:automation/irrelevant` (exclude google account messages)
      - archive
- The message only contains the necessary identifiers: ticket number and gmail message ID
    - the GCF will fetch the full message from Gmail API

### Event structure

```typescript
interface EmailReceived {
    ticket: string;
    email_id: string; // GCF processes each email individually by ID
}
```

### [Limits][quotas-and-limits]

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

## Deployment

Addresses of scripts

Scripts have to live in the Entretien Robot account b/c that's where the Gmail account lives.

### Production

- https://script.google.com/home/projects/13NajHhRJdLSpnOqInDGL90so-vn0dtSCwYNS11kOg2uuEewKmdqBlK_t
- `{"scriptId":"13NajHhRJdLSpnOqInDGL90so-vn0dtSCwYNS11kOg2uuEewKmdqBlK_t"}`

### Staging

- https://script.google.com/home/projects/1uRcp7axu72g242JSr2a3-RUcxOtIBiWGKXtn9xV0KykENUsd9lN216p3/
- `{"scriptId":"1uRcp7axu72g242JSr2a3-RUcxOtIBiWGKXtn9xV0KykENUsd9lN216p3"}`

[quotas-and-limits]: https://developers.google.com/apps-script/guides/services/quotas
