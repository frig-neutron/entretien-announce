import {IntakeFormData} from "./intake-form-data";

export function jiraService(): JiraService {
  return {
    createIssue(intakeFormData: IntakeFormData): Promise<String> {
      // TODO: idempotence - replaying the same issue multiple times should not re-create issue
      // probably a good idea to use a hidden field w/ form data hash
      return Promise.resolve("");
    }

  }
}
export interface JiraService {
  createIssue: (intakeFormData: IntakeFormData) => Promise<String>
}
