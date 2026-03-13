function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readResponseBody<T>(response: Response): Promise<T | string | null> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text
  }
}

function extractErrorMessage(
  payload: unknown,
  fallbackMessage: string,
  statusText?: string
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  if (isRecord(payload)) {
    const error = payload.error
    if (typeof error === 'string' && error.trim()) {
      return error.trim()
    }

    if (isRecord(error)) {
      const nestedMessage = error.message
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        return nestedMessage.trim()
      }
    }

    const message = payload.message
    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }

  return fallbackMessage || statusText || 'Request failed'
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage = 'Request failed'
): Promise<T> {
  const payload = await readResponseBody<T>(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, fallbackMessage, response.statusText))
  }

  if (payload === null) {
    throw new Error(fallbackMessage)
  }

  return payload as T
}

export async function readApiError(
  response: Response,
  fallbackMessage = 'Request failed'
): Promise<string> {
  const payload = await readResponseBody(response)
  return extractErrorMessage(payload, fallbackMessage, response.statusText)
}
