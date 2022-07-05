export default class Status {
  constructor(statusCode, message = "") {
    this.statusCode = statusCode;
    this.message = message;
  }

  static StatusCode = {
    UNKNOWN: 0,
    OK: 1,
    Error: 2,
  };

  static UNKNOWN = new Status(Status.StatusCode.UNKNOWN, "unknown");

  static OK = new Status(Status.StatusCode.OK);

  static createError(message) {
    return new Status(Status.StatusCode.Error, message);
  }

  ok() {
    return this.statusCode === Status.StatusCode.OK;
  }
}