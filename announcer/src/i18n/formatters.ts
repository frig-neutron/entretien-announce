import type {FormattersInitializer} from 'typesafe-i18n'
import type {Locales, Formatters} from './i18n-types'
import {DateTime, DateTimeFormatOptions, Duration, DurationOptions, Interval} from "luxon";

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {

  const formatters: Formatters = {
    dtHeader(value: DateTime): string {
      if (value) {
        return value.setLocale(locale).toLocaleString({})
      } else {
        return "undefined"
      }
    },
    monthYear(value: DateTime): string {
      if (value) {
        return value.setLocale(locale).toLocaleString({month: "long", year: "numeric"})
      } else {
        return "undefined"
      }
    },
    subjectReportInterval(interval: Interval): string {
      const formatOpts: DateTimeFormatOptions = {month: "long", year: "numeric"};
      return interval.start.setLocale(locale).toLocaleString(formatOpts)
    },
    durationInDays(duration: Duration): string {
      const days = duration.as("days")
      const formatOpts: DurationOptions = {locale: locale}
      return Duration.fromObject({days: Math.floor(days)}).reconfigure(formatOpts).toHuman()
    },
  }

  return formatters
}
