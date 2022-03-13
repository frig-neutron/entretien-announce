export type Application_factory = () => Application

export function defaultApplicationFactory(): Application {
  return {
    announce(today: string): void {
    }
  }
}
