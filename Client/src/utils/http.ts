interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
}

const hasResponse = (error: unknown): error is ErrorWithResponse =>
  typeof error === 'object' && error !== null && 'response' in error;

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (hasResponse(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const getErrorStatus = (error: unknown) => (hasResponse(error) ? error.response?.status : undefined);
