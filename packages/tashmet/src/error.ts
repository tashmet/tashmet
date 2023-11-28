
export class TashmetError extends Error {

}

export class TashmetServerError extends TashmetError {
  constructor(message: string, public readonly errInfo: Document) {
    super(message);
  }
}
