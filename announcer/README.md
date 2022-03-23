# Announcer Function

This component queries jira and produces announcements for a directory of recipients.

The number of announcements == number of recipients.


## Localization

- done using the [`typesafe-i18n`][typesafe-i18n] lib
- requires a generator. The generator watches files of interest, unless you specify --no-watch 
  (check `package.json` for script details)
  

[typesafe-i18n]: https://github.com/ivanhofer/typesafe-i18n
