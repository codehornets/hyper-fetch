import { createInterceptor, testMiddleware } from "tests/server";
import { ErrorCodesType } from "tests/server/server.constants";
import { buildMock } from "./mocking";

export type GetManyResponseType = {
  name: string;
  age: number;
}[];

export const getManyRequest = testMiddleware<GetManyResponseType>()({ endpoint: "/get-many" });

export const getManyMock = buildMock(getManyRequest, [
  { name: "Maciej", age: 123 },
  { name: "Kacper", age: 321 },
  { name: "Kuba", age: 111 },
]);

export const getManyAlternativeMock = buildMock(getManyRequest, [
  { name: "Albert", age: 321 },
  { name: "Szymon", age: 123 },
  { name: "Kuba", age: 111 },
]);

export const interceptGetMany = <StatusType extends number | ErrorCodesType>(status: StatusType) =>
  createInterceptor(getManyMock, status);