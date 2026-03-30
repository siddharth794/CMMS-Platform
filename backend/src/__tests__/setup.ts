import { mock, MockProxy } from 'jest-mock-extended';
import type { Request, Response, NextFunction } from 'express';

jest.mock('swagger-ui-express', () => {
  return {
    serve: [],
    setup: function() { return function() {}; },
  };
});

jest.mock('swagger-jsdoc', () => () => ({}));

export * from 'jest-mock-extended';

export const createMockRequest = (overrides?: Partial<Request>): MockProxy<Request> => {
  return mock<Request>({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  });
};

export const createMockResponse = (): MockProxy<Response> => {
  const res = mock<Response>();
  res.status.mockReturnThis();
  res.json.mockReturnThis();
  res.send.mockReturnThis();
  return res;
};

export const createMockNext = (): MockProxy<NextFunction> => {
  return mock<NextFunction>();
};

process.env.JWT_SECRET_KEY = 'test-secret-key';
process.env.NODE_ENV = 'test';