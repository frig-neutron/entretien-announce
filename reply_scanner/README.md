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
- configure script configuration keys:
  - `GCP_PROJECT`: project hosting the pubsub topic to notify
  - `PUBSUB_TARGET`: name of topic that will receive email notifications
  - `PUBLISHER_SA_KEY`: JSON key of the Service account that will publish messages
  - `ROBOT_EMAIL`: the robot's actual email address.
  
Key configuration can be done
  - by hand: `⚙️ Project Settings` > `Script Properties` > `Add script property`
  - by code: *FIXME: bork atm*

## Operation principles

- wake up every N minutes on a timed
  trigger, [subject to limits](#limitsquotas-and-limits)
- search for `in:Inbox is:unread` threads
    - if message contains ticket info, queue up operation to 
        - produce event to GCF HTTP endpoint, and
        - mark as `read` <sup>[1][1]</sup>
    - else, 
      - mark `read` (exclude google account messages)
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
runtime. The GCF runtime can actually affect this, if the function takes a while to process the 
messages we send it. It would be much better if we could publish directly to pubsub from the GAS 
Hmm... TODO

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

## Decision history

### HTTP GCF trigger vs Pubsub-via-HTTP

Sure HTTP triggers are simple to implement, but they're synchronous with message processing on 
the GCF side. If the GCF takes a long time to process the message, it will eat into the 
90-minute daily CPU budget. This could become an issue when dealing with attachments, as is the 
plan.

Pro:

- simpler message troubleshooting: a backup subscription on the topic that gives 7d retention to 
  everything the topic got
- more message replay options: replay by rewinding the sub
- presumably a more reliable call from the script side, which is less likely to time out

Con: 

- more complex to make a call: need 2 calls to google oauth API (get a JWT token and exchange it 
  for a Bearer token)
- need more resources on the GCP side: publisher SA + topic + subs in addition to function.
- 10 MB payload limit (not really an issue - but it's a limit )

Conclusion:

- GCF + HTTP has always been a pain to work with. The GAS->Pubsub approach is easy enough to set 
  up ∴ going to use that. CYA HTTP GCFs.

### Labels vs Read status

Moving from using labels for marking processed messages to using the `read` status. 

- Reason: Labels apply to threads. If a thread is marked as "processed" and a new message 
  arrives, that message will be skipped in future scans.
- Read status applies to individual messages. If a message is marked as "read" and a new 
  message arrives, the new message will be scanned.
- Not as fine-grained labels, but whatcha gonna do?

Alternatives

Cloud Function keeps track of processed messages

- Always send ids for all new messages arrived within the last N minutes.
- GCF keeps a datastore index of processed message IDs.
- Advantage: simple script, don't even need to parse anything
- Disadvantage: introduction of persistent store into GCF dependencies. 

Using archive instead of label

- derp, same problem - archiving is thread-granular

Using stars instead of label

- would also work. Valid alternative.

[quotas-and-limits]: https://developers.google.com/apps-script/guides/services/quotas
[1]: #labels-vs-read-status
