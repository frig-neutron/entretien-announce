import {IntakeFormData} from "./intake-form-data";
import {JiraService} from "./jira-service";

export interface FormDataRouter {
  route(intakeFormData: IntakeFormData): Promise<String>
}

export function formDataRouter(jiraService: JiraService): FormDataRouter {
  return {
        async route(intakeFormData: IntakeFormData): Promise<String> {
          return jiraService.createIssue(intakeFormData)
        }
      }
}
