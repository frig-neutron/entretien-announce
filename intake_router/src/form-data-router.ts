import { IntakeFormData } from "./intake-form-data";

export interface FormDataRouter {
  route(intakeFormData: IntakeFormData): String
}

export function formDataRouter(): FormDataRouter {
  return {
    route(intakeFormData: IntakeFormData): String {
      return "";
    }
  }
}
