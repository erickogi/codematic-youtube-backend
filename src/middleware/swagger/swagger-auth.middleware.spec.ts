import { SwaggerAuthMiddleware } from 'src/middleware';
import { appConfig } from 'src/config';
interface MockRequest {
  headers?: { [key: string]: string };
}
describe('SwaggerAuthMiddleware', () => {
  let middleware: SwaggerAuthMiddleware;
  const mockRequest: MockRequest = {};
  const mockResponse = {
    set: jest.fn(),
    status: jest.fn(() => mockResponse),
    send: jest.fn(),
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    middleware = new SwaggerAuthMiddleware();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(new SwaggerAuthMiddleware()).toBeDefined();
  });

  it('should pass if valid credentials are provided', () => {
    const validCredentials = Buffer.from(`${appConfig().swagger_user}:${appConfig().swagger_password}`).toString('base64');

    mockRequest.headers = { authorization: `Basic ${validCredentials}` };

    middleware.use(mockRequest, mockResponse, mockNext);

    expect(mockResponse.set).not.toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should respond with a 401 error if no credentials are provided', () => {
    mockRequest.headers = {};

    middleware.use(mockRequest, mockResponse, mockNext);

    expect(mockResponse.set).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="Authentication required"');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith('Authentication required');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should respond with a 401 error if invalid credentials are provided', () => {
    const invalidCredentials = Buffer.from('invalid:password').toString('base64');
    mockRequest.headers = { authorization: `Basic ${invalidCredentials}` };

    middleware.use(mockRequest, mockResponse, mockNext);

    expect(mockResponse.set).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="Authentication required"');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith('Authentication required');
    expect(mockNext).not.toHaveBeenCalled();
  });
});
