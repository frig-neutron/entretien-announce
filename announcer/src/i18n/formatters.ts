import type {FormattersInitializer} from 'typesafe-i18n'
import type {Locales, Formatters} from './i18n-types'
import {DateTimeFormatOptions, Interval} from "luxon";

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {

  const formatters: Formatters = {
    subjectReportInterval: (interval: Interval): string => {
      const formatOpts: DateTimeFormatOptions = {month: "long", year: "numeric"};
      return interval.start.setLocale(locale).toLocaleString(formatOpts)
    }
  }

  return formatters
}
