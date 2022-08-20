import {IntakeFormData} from "./intake-form-data";

export function jiraService(): JiraService {
  return {
    createIssue(intakeFormData: IntakeFormData): Promise<String> {
      return Promise.resolve("");
    }

  }
}
export interface JiraService {
  createIssue: (intakeFormData: IntakeFormData) => Promise<String>
}
