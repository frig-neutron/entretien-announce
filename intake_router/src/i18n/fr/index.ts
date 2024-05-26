import type {BaseTranslation} from '../i18n-types'

const fr: BaseTranslation = {
  ticketReceived: {
    subject: 'Rapport de maintenance reçu',
    greeting: 'Cher {name:string},',
    topLine: 'Votre rapport de maintenance a été reçu.',
    jiraTicket: 'Un ticket Jira {issueKey:string} a été attribué à ce rapport.',
    reasonForReceiving: 'Vous recevez cet email parce que le ticket a été soumis en votre nom.'
  }
}

export default fr
