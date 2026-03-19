/**
 * Utility to send consistent success and error responses
 */
export const sendSuccess = (res, data, statusCode = 200) => {
    res.status(statusCode).json({
        status: 'success',
        data
    });
};

export const sendError = (res, message, statusCode = 500, details = null) => {
    const response = {
        status: statusCode >= 500 ? 'error' : 'fail',
        message
    };

    if (details) {
        response.details = details;
    }

    res.status(statusCode).json(response);
};
