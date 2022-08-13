export interface IntakeFormData {
  rowIndex: number
  building: string
  summary: string
  description: string
  area: string
  reporter: string
  priority: string
}

export function parseIntakeFormData(data: any): IntakeFormData {
  return {
    area: "", building: "", description: "", priority: "", reporter: "", rowIndex: 0, summary: ""
  }
}
