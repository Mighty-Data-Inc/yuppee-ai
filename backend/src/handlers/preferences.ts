import type { APIGatewayProxyResult } from 'aws-lambda'
import type { LambdaHandler, PreferencesRequest, PreferencesResponse } from '../types'
import { PreferencesStore } from '../services/preferencesStore'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export const handler: LambdaHandler = async (event, _context) => {
  try {
    const useMock = process.env['USE_MOCK'] !== 'false'
    const store = new PreferencesStore({
      tableName: process.env['DYNAMODB_TABLE_NAME'],
      region: process.env['AWS_REGION'],
      useMock,
    })

    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.['userId']
      if (!userId || userId.trim() === '') {
        return errorResponse(400, 'Missing required query parameter: userId')
      }

      const preferences = await store.getPreferences(userId)
      const response: PreferencesResponse = { userId, preferences }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(response),
      }
    }

    // POST — save preferences
    let request: Partial<PreferencesRequest> = {}

    if (event.body) {
      try {
        request = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
      } catch {
        return errorResponse(400, 'Invalid JSON in request body')
      }
    }

    if (!request.userId || typeof request.userId !== 'string' || request.userId.trim() === '') {
      return errorResponse(400, 'Missing required field: userId')
    }

    if (request.queryCategory && request.preferences) {
      await store.savePreferences(request.userId, request.queryCategory, request.preferences)
    }

    const preferences = await store.getPreferences(request.userId)
    const response: PreferencesResponse = { userId: request.userId, preferences }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return errorResponse(500, message)
  }
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  }
}
