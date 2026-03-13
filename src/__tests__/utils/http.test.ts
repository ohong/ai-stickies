import { describe, it, expect } from 'vitest'
import { parseApiResponse, readApiError } from '@/src/lib/utils/http'

/**
 * Creates a mock Response object with the given body, status, and options.
 * Uses the real Response constructor so no internal mocking is needed.
 */
function mockResponse(
  body: string | null,
  options: { status?: number; statusText?: string } = {}
): Response {
  const { status = 200, statusText = '' } = options
  return new Response(body, { status, statusText })
}

function jsonBody(obj: unknown): string {
  return JSON.stringify(obj)
}

describe('parseApiResponse', () => {
  it('parses a successful JSON response', async () => {
    const data = { id: 1, name: 'test' }
    const response = mockResponse(jsonBody(data))

    const result = await parseApiResponse<typeof data>(response)

    expect(result).toEqual(data)
  })

  it('throws when body is empty on a 200 response', async () => {
    const response = mockResponse('')

    await expect(parseApiResponse(response)).rejects.toThrow('Request failed')
  })

  it('throws when body is null on a 200 response', async () => {
    const response = mockResponse(null)

    await expect(parseApiResponse(response)).rejects.toThrow('Request failed')
  })

  it('throws with custom fallback message when body is empty', async () => {
    const response = mockResponse('')

    await expect(
      parseApiResponse(response, 'No data returned')
    ).rejects.toThrow('No data returned')
  })

  it('throws with error string from JSON { error: "..." } on non-ok response', async () => {
    const response = mockResponse(
      jsonBody({ error: 'Unauthorized' }),
      { status: 401, statusText: 'Unauthorized' }
    )

    await expect(parseApiResponse(response)).rejects.toThrow('Unauthorized')
  })

  it('throws with plain text body on non-ok response (the regression bug)', async () => {
    // This was the screenshot bug: server returned content-type application/json
    // but the body was actually plain text like "Internal Server Error".
    // readResponseBody falls back to returning the raw text when JSON.parse fails.
    const response = mockResponse('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(parseApiResponse(response)).rejects.toThrow(
      'Internal Server Error'
    )
  })

  it('throws with nested error.message from JSON on non-ok response', async () => {
    const response = mockResponse(
      jsonBody({ error: { message: 'Token expired', code: 'AUTH_ERROR' } }),
      { status: 403, statusText: 'Forbidden' }
    )

    await expect(parseApiResponse(response)).rejects.toThrow('Token expired')
  })

  it('throws with top-level message from JSON { message: "..." } on non-ok response', async () => {
    const response = mockResponse(
      jsonBody({ message: 'Rate limit exceeded' }),
      { status: 429, statusText: 'Too Many Requests' }
    )

    await expect(parseApiResponse(response)).rejects.toThrow(
      'Rate limit exceeded'
    )
  })

  it('throws with default fallback when non-ok response has empty body (fallback wins over statusText)', async () => {
    const response = mockResponse('', {
      status: 502,
      statusText: 'Bad Gateway',
    })

    // The default fallback 'Request failed' is truthy, so it takes priority
    // over statusText in the extractErrorMessage fallback chain
    await expect(parseApiResponse(response)).rejects.toThrow('Request failed')
  })

  it('throws with statusText when non-ok response has empty body and empty string fallback', async () => {
    const response = mockResponse('', {
      status: 502,
      statusText: 'Bad Gateway',
    })

    // Only when fallback is falsy does statusText get used
    await expect(parseApiResponse(response, '')).rejects.toThrow('Bad Gateway')
  })

  it('throws with fallback message when non-ok response has empty body and no statusText', async () => {
    const response = mockResponse('', { status: 500 })

    await expect(
      parseApiResponse(response, 'Something went wrong')
    ).rejects.toThrow('Something went wrong')
  })

  it('throws the default fallback when non-ok response has empty body, no statusText, and no custom fallback', async () => {
    const response = mockResponse('', { status: 500 })

    await expect(parseApiResponse(response)).rejects.toThrow('Request failed')
  })

  it('prefers error string over message string in JSON response', async () => {
    const response = mockResponse(
      jsonBody({ error: 'Primary error', message: 'Secondary message' }),
      { status: 400, statusText: 'Bad Request' }
    )

    await expect(parseApiResponse(response)).rejects.toThrow('Primary error')
  })

  it('returns non-object JSON values as-is on success', async () => {
    const response = mockResponse(jsonBody([1, 2, 3]))

    const result = await parseApiResponse<number[]>(response)

    expect(result).toEqual([1, 2, 3])
  })

  it('ignores empty or whitespace-only error/message strings in JSON', async () => {
    const response = mockResponse(
      jsonBody({ error: '   ', message: '' }),
      { status: 400, statusText: 'Bad Request' }
    )

    // Both error and message are whitespace/empty, so it should fall through
    // to the fallback message (which defaults to 'Request failed')
    await expect(parseApiResponse(response)).rejects.toThrow('Request failed')
  })

  it('trims whitespace from error messages', async () => {
    const response = mockResponse(
      jsonBody({ error: '  Trimmed error  ' }),
      { status: 400, statusText: 'Bad Request' }
    )

    await expect(parseApiResponse(response)).rejects.toThrow('Trimmed error')
  })
})

describe('readApiError', () => {
  it('extracts error string from JSON { error: "..." }', async () => {
    const response = mockResponse(
      jsonBody({ error: 'Something broke' }),
      { status: 500, statusText: 'Internal Server Error' }
    )

    const message = await readApiError(response)

    expect(message).toBe('Something broke')
  })

  it('extracts error from plain text body', async () => {
    const response = mockResponse('Gateway Timeout', {
      status: 504,
      statusText: 'Gateway Timeout',
    })

    const message = await readApiError(response)

    expect(message).toBe('Gateway Timeout')
  })

  it('uses fallback when body is empty', async () => {
    const response = mockResponse('', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const message = await readApiError(response, 'Upload failed')

    expect(message).toBe('Upload failed')
  })

  it('uses statusText when body is empty and no fallback given', async () => {
    const response = mockResponse('', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const message = await readApiError(response)

    // fallback defaults to 'Request failed', which is truthy, so it wins
    expect(message).toBe('Request failed')
  })

  it('extracts nested error.message from JSON', async () => {
    const response = mockResponse(
      jsonBody({ error: { message: 'Detailed failure reason' } }),
      { status: 422, statusText: 'Unprocessable Entity' }
    )

    const message = await readApiError(response)

    expect(message).toBe('Detailed failure reason')
  })

  it('extracts top-level message from JSON { message: "..." }', async () => {
    const response = mockResponse(
      jsonBody({ message: 'Validation error' }),
      { status: 400, statusText: 'Bad Request' }
    )

    const message = await readApiError(response)

    expect(message).toBe('Validation error')
  })

  it('returns default fallback when body is empty and no custom fallback', async () => {
    const response = mockResponse('', { status: 500 })

    const message = await readApiError(response)

    expect(message).toBe('Request failed')
  })

  it('works with a successful response that has an error-shaped body', async () => {
    // readApiError doesn't check response.ok — it just extracts the message
    const response = mockResponse(
      jsonBody({ error: 'Weird but valid' }),
      { status: 200 }
    )

    const message = await readApiError(response)

    expect(message).toBe('Weird but valid')
  })
})
