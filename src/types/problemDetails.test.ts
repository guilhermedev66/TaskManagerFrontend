import { describe, expect, it } from 'vitest'
import { isProblemDetails, isValidationProblemDetails } from './problemDetails'

describe('isProblemDetails', () => {
  it('rejects an empty object', () => {
    expect(isProblemDetails({})).toBe(false)
  })

  it('rejects an arbitrary object without ProblemDetails structure', () => {
    expect(isProblemDetails({ qualquer: 'valor' })).toBe(false)
  })

  it('accepts an object with a numeric status', () => {
    expect(isProblemDetails({ status: 400 })).toBe(true)
  })

  it('rejects a status that is not a number', () => {
    expect(isProblemDetails({ status: '400' })).toBe(false)
  })

  it('rejects null and non-object values', () => {
    expect(isProblemDetails(null)).toBe(false)
    expect(isProblemDetails('erro')).toBe(false)
    expect(isProblemDetails(42)).toBe(false)
  })
})

describe('isValidationProblemDetails', () => {
  it('accepts a valid ValidationProblemDetails payload', () => {
    expect(
      isValidationProblemDetails({
        status: 400,
        title: 'One or more validation errors occurred.',
        errors: { Title: ['O campo Title é obrigatório.'] },
      }),
    ).toBe(true)
  })

  it('rejects errors containing a value that is not string[]', () => {
    expect(
      isValidationProblemDetails({
        status: 400,
        errors: { Title: ['ok'], Priority: [1, 2] },
      }),
    ).toBe(false)
  })

  it('rejects a payload missing status even with valid errors', () => {
    expect(isValidationProblemDetails({ errors: { Title: ['ok'] } })).toBe(false)
  })
})
