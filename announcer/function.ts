import {Version2Client} from "jira.js";
import {config as dotenv_config} from "dotenv"

exports.announcer = (message: any, context: any) => {
  const result = dotenv_config()

  const email = String(process.env.JIRA_AUTH_EMAIL)
  const apiToken = String(process.env.JIRA_API_TOKEN)

  const client = new Version2Client({
    host: "https://lalliance.atlassian.net",
    authentication: {
      basic: {
        email: email,
        apiToken: apiToken
      }
    }
  });


  // const open = await client.issueSearch.searchForIssuesUsingJql({
  //   jql: `project = "TRIAG" AND ((updated >= "2022-01-01" AND status in (Done, Closed)) OR status not in (Done, Closed)) ORDER BY updated DESC `,
  //   expand: ""
  // })
  const environment = process.env
  // const recentlyClosed = await client.issueSearch.searchForIssuesUsingJql({
  //   jql: `project = "TRIAG" AND status in (Closed, Done, Resolved) AND status changed to (Closed, Done, Resolved) DURING ("2022-01-01", "2022-04-04")`,
  //   expand: ""
  // })

  console.log(environment)
}
