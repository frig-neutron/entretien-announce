import {IntakeFormData} from "./intake-form-data";

export interface FormDataRouter {
  route(intakeFormData: IntakeFormData): Promise<String>
}

export function formDataRouter(): FormDataRouter {
  return {
        async route(intakeFormData: IntakeFormData): Promise<String> {
          return "";
        }
      }
}
