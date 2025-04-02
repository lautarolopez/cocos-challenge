export class HttpError extends Error {
    constructor(message, httpStatusCode) {
        super(message);
        this.httpStatusCode = httpStatusCode;
    }
}
