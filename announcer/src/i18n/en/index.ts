import type {BaseTranslation} from '../i18n-types'

const en: BaseTranslation = {
  subject: 'Ticket report for {interval:Interval|subjectReportInterval}',
  greeting: 'Dear {name:string},',
  preamble: `Here is a summary of jira ticket activity for {month:DateTime|monthYear}`,
  issueKey: 'Ticket no.',
  issueSummary: 'Summary',
  outtro: [
    'This email has been sent by an automated system. ',
    'If you do not wish to receive these messages please contact Daniil.'
  ].join(''),
  created: {
    heading: "Tickets created between {start:DateTime|dtHeader} and {end:DateTime|dtHeader}"
  },
  allTickets: {
    heading: "All open tickets"
  },
  closed: {
    heading: "Tickets closed between {start:DateTime|dtHeader} and {end:DateTime|dtHeader}"
  },
}

export default en
