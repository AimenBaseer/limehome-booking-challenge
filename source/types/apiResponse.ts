export class ApiResponse<T = null> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T | null | undefined;

    constructor(
        success: boolean,
        statusCode: number,
        message: string,
        data?: T
    ) {
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
