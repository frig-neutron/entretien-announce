import type {BaseTranslation} from '../i18n-types'

const en: BaseTranslation = {
  ticketReceived: {
    subject: 'Maintenance report received',
    greeting: 'Dear {name:string},',
    topLine: 'Your maintenance report has been received.',
    jiraTicket: 'Jira ticket {issueKey:string} has been assigned to this report.',
    reasonForReceiving: 'You are receiving this email because the ticket was submitted on your behalf.'
  },
}

export default en
