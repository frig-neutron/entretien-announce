# Announcer Function

This component queries jira and produces announcements for a directory of recipients.

The number of announcements == number of recipients.

## Localization

- done using the [`typesafe-i18n`][typesafe-i18n] lib
- requires a generator. The generator watches files of interest, unless you specify --no-watch
  (check `package.json` for script details)
  
## ADR

### Handlebars

Tried templating w/ Handlebars. Turned out a no-go b/c of localization requirement. The report model
doesn't include localized strings. I _could_ include them, but then I'd have to be aware of the
language of the report at the time of the report creation, which doesn't work with the report being
language-agnostic. In my mind I'd like to introduce language at the rendering phase, and not before.

Other thing that I reject was crating a handlebars `{{l key="stringKey"}}` helper as an adaptor for 
the `typesafe-i18n` `L` object. This would cost me localization type safety, since all the calls 
would be dynamic. After all this effort learning `typesafe-i18n` I'd prefer to stay with typesafe 
localizations.

The hybrid solution suffers from the same drawback: I _could_ include localization keys on the 
`ReportModel` classes, but that also loses type-safety.

I also considered re-wrapping the `ReportModel` with a sort of deep-decorator. The re-wrapping 
would be done at render time. I was thinking of producing an object tree containing all the 
`ReportModel` attributes which would contain localized strings, and feed _that_ into the 
Handlebars template, but it seems like too much work compared to the alternative:

The alternative is directly buidling HTML using a fluent builder. This requires all the same 
work as re-wrapping the report model, only at the end you're left with a direct HTML 
representation, and not a data object that needs _another_ level of templating. I'm choosing 
[tiny-html-builder][tiny-html-builder] because it looks small, simple and fluent.


[tiny-html-builder]: https://www.npmjs.com/package/tiny-html-builder
[typesafe-i18n]: https://github.com/ivanhofer/typesafe-i18n
