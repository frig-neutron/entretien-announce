import type {BaseTranslation} from '../i18n-types'

const fr: BaseTranslation = {
  subject: 'Rapport de ticket pour {interval:Interval|subjectReportInterval}',
  greeting: 'Cher {name:string},',
  preamble: `Voici un résumé de l'activité des tickets jira pour {month:DateTime|monthYear}`,
  issue: {
    age: {
      header: 'L\'âge du ticket',
      value: '{duration:Duration|durationInDays}'
    },
    key: {
      header: 'Numéro'
    },
    status: {
      header: 'Statut'
    },
    summary: {
      header: 'Sommaire',
    }
  },
  missingValue: "Inconnu",
  outtro: [
    'Cet e-mail a été envoyé par un système automatisé. ',
    'Si vous ne souhaitez pas recevoir ces messages, veuillez contacter Daniil'
  ].join(''),
  created: {
    heading: "Tickets créés entre {start:DateTime|dtHeader} et {end:DateTime|dtHeader}"
  },
  allTickets: {
    heading: "Tous les tickets en cours"
  },
  closed: {
    heading: "Tickets terminés entre {start:DateTime|dtHeader} et {end:DateTime|dtHeader}"
  },
}

export default fr
