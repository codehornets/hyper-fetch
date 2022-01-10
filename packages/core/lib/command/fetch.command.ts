import {
  FetchCommandDump,
  getAbortKey,
  addAbortController,
  abortCommand,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchCommandOptions,
  FetchType,
  ParamsType,
} from "command";
import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientQueryParamsType, ClientResponseType } from "client";
import { FetchBuilder } from "builder";
import { getCacheRequestKey } from "cache";
import { FetchAction } from "action";

export class FetchCommand<
  ResponseType,
  PayloadType,
  QueryParamsType extends ClientQueryParamsType,
  ErrorType,
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  protected mockCallback: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;

  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: QueryParamsType | string | NegativeTypes;
  options: ClientOptions | undefined;
  cancelable?: boolean;
  retry?: boolean | number;
  retryTime?: number;
  cacheTime?: number;
  queued?: boolean;
  deepEqual?: boolean;

  abortKey: string;
  cacheKey: string;
  queueKey: string;

  actions: string[] = [];

  constructor(
    readonly builder: FetchBuilder<ErrorType, ClientOptions>,
    readonly commandOptions: FetchCommandOptions<EndpointType, ClientOptions>,
    readonly current?: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions
    >,
  ) {
    const { baseUrl } = builder;

    this.endpoint = current?.endpoint || commandOptions.endpoint;
    this.headers = current?.headers || commandOptions.headers;
    this.method = commandOptions.method || HttpMethodsEnum.get;
    this.params = current?.params;
    this.data = current?.data;
    this.queryParams = current?.queryParams;
    this.mockCallback = current?.mockCallback;

    this.cancelable = current?.cancelable || commandOptions.cancelable;
    this.retry = current?.retry || commandOptions.retry;
    this.retryTime = current?.retryTime || commandOptions.retryTime;
    this.cacheTime = current?.cacheTime || commandOptions.cacheTime;
    this.queued = current?.queued || commandOptions.queued;
    this.deepEqual = current?.deepEqual || commandOptions.deepEqual;

    this.abortKey = current?.abortKey || commandOptions.abortKey || getAbortKey(this.method, baseUrl, this.endpoint);
    this.cacheKey = current?.cacheKey || commandOptions.cacheKey || getCacheRequestKey(this);
    this.queueKey = current?.queueKey || commandOptions.queueKey || getCacheRequestKey(this);

    addAbortController(this.builder, this.abortKey);
  }

  public setData = (data: PayloadType) => {
    return this.clone<true>({ data });
  };

  public setParams = (params: ExtractRouteParams<EndpointType>) => {
    return this.clone<HasData, true, HasQuery>({ params });
  };

  public setQueryParams = (queryParams: QueryParamsType | string) => {
    return this.clone<HasData, HasParams, true>({ queryParams });
  };

  public setHeaders = (headers: HeadersInit) => {
    return this.clone({ headers });
  };

  public setCancelable = (cancelable: boolean) => {
    return this.clone({ cancelable });
  };

  public setRetry = (retry: FetchCommandOptions<EndpointType, ClientOptions>["retry"]) => {
    return this.clone({ retry });
  };

  public setRetryTime = (retryTime: FetchCommandOptions<EndpointType, ClientOptions>["retryTime"]) => {
    return this.clone({ retryTime });
  };

  public setCacheTime = (cacheTime: FetchCommandOptions<EndpointType, ClientOptions>["cacheTime"]) => {
    return this.clone({ cacheTime });
  };

  public setQueued = (queued: boolean) => {
    return this.clone({ queued });
  };

  public setAbortKey = (abortKey: string) => {
    return this.clone({ abortKey });
  };

  public setCacheKey = (cacheKey: string) => {
    return this.clone({ cacheKey });
  };

  public setQueueKey = (queueKey: string) => {
    return this.clone({ queueKey });
  };

  public addAction = (
    action:
      | FetchAction<
          ResponseType,
          PayloadType | unknown,
          ErrorType | Error,
          QueryParamsType | ClientQueryParamsType,
          ClientOptions | unknown
        >
      | string,
  ) => {
    const actionName = typeof action === "string" ? action : action?.getName();
    const actions = [...this.actions, actionName];
    return this.clone({ actions: [...new Set(actions)] });
  };

  public removeAction = (
    action:
      | FetchAction<
          ResponseType,
          PayloadType | unknown,
          ErrorType | Error,
          QueryParamsType | ClientQueryParamsType,
          ClientOptions | unknown
        >
      | string,
  ) => {
    const actionName = typeof action === "string" ? action : action?.getName();
    const actions = this.actions.filter((currentAction) => currentAction !== actionName);
    return this.clone({ actions });
  };

  public mock = (mockCallback: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockCallback });
  };

  public abort = () => {
    abortCommand(this);

    return this.clone();
  };

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.commandOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  public dump(): FetchCommandDump<ClientOptions> {
    return {
      endpoint: this.endpoint,
      headers: this.headers,
      method: this.method,
      queryParams: this.queryParams,
      data: this.data,
      cancelable: this.cancelable,
      retry: this.retry,
      retryTime: this.retryTime,
      cacheTime: this.cacheTime,
      queued: this.queued,
      deepEqual: this.deepEqual,
      options: this.commandOptions.options,
      disableResponseInterceptors: this.commandOptions.disableResponseInterceptors,
      disableRequestInterceptors: this.commandOptions.disableRequestInterceptors,
      abortKey: this.abortKey,
      cacheKey: this.cacheKey,
      queueKey: this.queueKey,
      actions: this.actions,
    };
  }

  public clone<D extends true | false = HasData, P extends true | false = HasParams, Q extends true | false = HasQuery>(
    options?: DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>,
  ): FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions, D, P, Q> {
    const currentOptions: DefaultOptionsType<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions
    > = {
      ...this.dump(),
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
      mockCallback: options?.mockCallback || this.mockCallback,
    };

    const cloned = new FetchCommand<
      ResponseType,
      PayloadType,
      QueryParamsType,
      ErrorType,
      EndpointType,
      ClientOptions,
      D,
      P,
      Q
    >(this.builder, this.commandOptions, currentOptions);

    return cloned;
  }

  public send: FetchMethodType<
    ResponseType,
    PayloadType,
    QueryParamsType,
    ErrorType,
    EndpointType,
    HasData,
    HasParams,
    HasQuery
  > = async (setup?: FetchType<PayloadType, QueryParamsType, EndpointType, HasData, HasParams, HasQuery>) => {
    if (this.mockCallback) return Promise.resolve(this.mockCallback(this.data as PayloadType));

    const command = this.clone(
      setup as DefaultOptionsType<ResponseType, PayloadType, QueryParamsType, ErrorType, EndpointType, ClientOptions>,
    );

    const { client } = this.builder;

    return client(command);
  };
}
// Typescript test cases

// import { FetchBuilder } from "builder";

// const builder = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// });

// const getUsers = fetchCommand.create<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = fetchCommand.create<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = fetchCommand.create<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = fetchCommand.create<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });

// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });

// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });