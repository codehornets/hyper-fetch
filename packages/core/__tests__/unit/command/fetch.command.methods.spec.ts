import { FetchBuilder } from "builder";
import { resetMocks, startServer, stopServer } from "../../utils/server";
import { testBuilder } from "../../utils/server/server.constants";

const getBuilder = () => {
  return new FetchBuilder({ baseUrl: "/some-url" }).build();
};

let builder = getBuilder();

describe("[Methods] FetchCommand", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = getBuilder();
    resetMocks();
  });

  afterAll(() => {
    stopServer();
    testBuilder.clear();
  });

  it("should change the 'cacheKey' when update the query params or params", async () => {
    const command = builder.createCommand()({
      endpoint: "/some-endpoint/:paramId",
    });
    const commandWithParams = command.setParams({ paramId: 1 });
    const commandWithQueryParams = commandWithParams.setQueryParams({ test: 1 });

    expect(command.cacheKey).not.toEqual(commandWithParams.cacheKey);
    expect(command.cacheKey).not.toEqual(commandWithQueryParams.cacheKey);
    expect(commandWithParams.cacheKey).not.toEqual(commandWithQueryParams.cacheKey);
  });

  it("should not change the 'cacheKey' once previously saved", async () => {
    const myCacheKey = "my-cache-key";

    const command = builder
      .createCommand()({
        endpoint: "/some-endpoint/:paramId",
      })
      .setCacheKey(myCacheKey);
    const commandWithParams = command.setParams({ paramId: 1 });
    const commandWithQueryParams = commandWithParams.setQueryParams({ test: 1 });

    expect(myCacheKey).toEqual(command.cacheKey);
    expect(myCacheKey).toEqual(commandWithParams.cacheKey);
    expect(myCacheKey).toEqual(commandWithQueryParams.cacheKey);
  });
});