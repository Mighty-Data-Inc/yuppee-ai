import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { handler } from '../handlers/search'

const mockContext = {} as Context

function makeEvent(body?: object | null): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'POST',
    body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    isBase64Encoded: false,
  }
}

describe('search handler', () => {
  beforeEach(() => {
    process.env['USE_MOCK'] = 'true'
  })

  it('returns 400 when query is missing', async () => {
    const event = makeEvent({})
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.error).toMatch(/query/i)
  })

  it('returns 400 when body is empty', async () => {
    const event = makeEvent(null)
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(400)
  })

  it('returns 200 with results when query is provided', async () => {
    const event = makeEvent({ query: 'interesting topics' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.results).toBeDefined()
    expect(Array.isArray(body.results)).toBe(true)
    expect(body.results.length).toBeGreaterThan(0)
  })

  it('results contain expected fields', async () => {
    const event = makeEvent({ query: 'interesting topics' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    const firstResult = body.results[0]
    expect(firstResult).toHaveProperty('id')
    expect(firstResult).toHaveProperty('title')
    expect(firstResult).toHaveProperty('url')
    expect(firstResult).toHaveProperty('snippet')
  })

  it('returns book results for book-related query', async () => {
    const event = makeEvent({ query: 'best book recommendations' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.query).toBe('best book recommendations')
    expect(body.results.length).toBe(6)
  })

  it('returns movie results for movie-related query', async () => {
    const event = makeEvent({ query: 'top rated movie 2023' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.results[0].id).toMatch(/^m/)
  })
})
