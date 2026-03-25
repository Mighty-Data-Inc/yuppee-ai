import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { handler } from '../handlers/widgets'

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

describe('widgets handler', () => {
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

  it('returns widgets for a book query', async () => {
    const event = makeEvent({ query: 'best book recommendations' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body)
    expect(body.widgets).toBeDefined()
    expect(Array.isArray(body.widgets)).toBe(true)
    expect(body.widgets.length).toBeGreaterThan(0)
  })

  it('book query returns a radio widget', async () => {
    const event = makeEvent({ query: 'best book recommendations' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    const body = JSON.parse(result.body)
    const radioWidget = body.widgets.find((w: { type: string }) => w.type === 'radio')
    expect(radioWidget).toBeDefined()
    expect(radioWidget.label).toMatch(/fiction/i)
  })

  it('book query returns a range slider widget', async () => {
    const event = makeEvent({ query: 'classic novel to read' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    const body = JSON.parse(result.body)
    const sliderWidget = body.widgets.find((w: { type: string }) => w.type === 'range-slider')
    expect(sliderWidget).toBeDefined()
    expect(sliderWidget).toHaveProperty('min')
    expect(sliderWidget).toHaveProperty('max')
  })

  it('movie query returns different widgets than book query', async () => {
    const bookEvent = makeEvent({ query: 'great book to read' })
    const movieEvent = makeEvent({ query: 'top rated movie' })

    const bookResult = await handler(bookEvent as APIGatewayProxyEvent, mockContext)
    const movieResult = await handler(movieEvent as APIGatewayProxyEvent, mockContext)

    const bookWidgets = JSON.parse(bookResult.body).widgets
    const movieWidgets = JSON.parse(movieResult.body).widgets

    const bookIds = bookWidgets.map((w: { id: string }) => w.id).sort()
    const movieIds = movieWidgets.map((w: { id: string }) => w.id).sort()

    expect(bookIds).not.toEqual(movieIds)
  })

  it('movie query returns a radio widget for format', async () => {
    const event = makeEvent({ query: 'best film of the year' })
    const result = await handler(event as APIGatewayProxyEvent, mockContext)
    const body = JSON.parse(result.body)
    const formatWidget = body.widgets.find((w: { id: string }) => w.id === 'format')
    expect(formatWidget).toBeDefined()
    expect(formatWidget.type).toBe('radio')
  })
})
