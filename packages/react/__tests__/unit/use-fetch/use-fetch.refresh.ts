import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Refreshing ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    jest.resetModules();
    await builder.clear();
  });

  it("should refetch data after refresh time of 200ms", async () => {});
  it("should save refresh error to separate container", async () => {});
  it("should not de-synchronize refreshing interval", async () => {});
  it("should refresh blurred tab", async () => {});
  it("should not refresh blurred tab", async () => {});
});
