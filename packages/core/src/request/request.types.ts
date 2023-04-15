import {
  NullableKeys,
  NegativeTypes,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractRequestQueryParamsType,
  ExtractAdapterType,
  ExtractEndpointType,
  ExtractHasDataType,
  ExtractHasParamsType,
  ExtractHasQueryParamsType,
  ExtractErrorType,
  ExtractResponseType,
  HttpMethodsType,
} from "types";
import { Request } from "request";
import {
  ResponseReturnType,
  QueryParamsType,
  ProgressType,
  ExtractAdapterOptions,
  BaseAdapterType,
  ExtractAdapterMethodType,
} from "adapter";
import { RequestEventType, ResponseDetailsType } from "managers";

// Progress
export type AdapterProgressEventType = { total: number; loaded: number };
export type AdapterProgressType = {
  progress: number;
  timeLeft: number;
  sizeLeft: number;
};

// Dump

/**
 * Dump of the request used to later recreate it
 */
export type RequestJSON<
  Request extends RequestInstance,
  // Bellow generics provided only to overcome the typescript bugs
  AdapterOptions = unknown,
  QueryParams = QueryParamsType,
  Params = ExtractParamsType<Request>,
> = {
  requestOptions: RequestOptionsType<
    string,
    AdapterOptions | ExtractAdapterType<Request>,
    ExtractAdapterMethodType<ExtractAdapterType<Request>>
  >;
  endpoint: string;
  method: ExtractAdapterMethodType<ExtractAdapterType<Request>>;
  headers?: HeadersInit;
  auth: boolean;
  cancelable: boolean;
  retry: number;
  retryTime: number;
  garbageCollection: number;
  cache: boolean;
  cacheTime: number;
  queued: boolean;
  offline: boolean;
  disableResponseInterceptors: boolean | undefined;
  disableRequestInterceptors: boolean | undefined;
  options?: AdapterOptions | ExtractAdapterOptions<ExtractAdapterType<Request>>;
  data: PayloadType<ExtractPayloadType<Request>>;
  params: Params | NegativeTypes;
  queryParams: QueryParams | NegativeTypes;
  abortKey: string;
  cacheKey: string;
  queueKey: string;
  effectKey: string;
  used: boolean;
  updatedAbortKey: boolean;
  updatedCacheKey: boolean;
  updatedQueueKey: boolean;
  updatedEffectKey: boolean;
  deduplicate: boolean;
  deduplicateTime: number;
};

// Request

/**
 * Configuration options for request creation
 */
export type RequestOptionsType<
  GenericEndpoint extends string,
  AdapterOptions extends Record<string, any>,
  RequestMethods = HttpMethodsType,
> = {
  /**
   * Determine the endpoint for request request
   */
  endpoint: GenericEndpoint;
  /**
   * Custom headers for request
   */
  headers?: HeadersInit;
  /**
   * Should the onAuth method get called on this request
   */
  auth?: boolean;
  /**
   * Request method GET | POST | PATCH | PUT | DELETE or set of method names handled by adapter
   */
  method?: RequestMethods;
  /**
   * Should enable cancelable mode in the Dispatcher
   */
  cancelable?: boolean;
  /**
   * Retry count when request is failed
   */
  retry?: number;
  /**
   * Retry time delay between retries
   */
  retryTime?: number;
  /**
   * Should we trigger garbage collection or leave data in memory
   */
  garbageCollection?: number;
  /**
   * Should we save the response to cache
   */
  cache?: boolean;
  /**
   * Time for which the cache is considered up-to-date
   */
  cacheTime?: number;
  /**
   * Should the requests from this request be send one-by-one
   */
  queued?: boolean;
  /**
   * Do we want to store request made in offline mode for latter use when we go back online
   */
  offline?: boolean;
  /**
   * Disable post-request interceptors
   */
  disableResponseInterceptors?: boolean;
  /**
   * Disable pre-request interceptors
   */
  disableRequestInterceptors?: boolean;
  /**
   * Additional options for your adapter, by default XHR options
   */
  options?: AdapterOptions;
  /**
   * Key which will be used to cancel requests. Autogenerated by default.
   */
  abortKey?: string;
  /**
   * Key which will be used to cache requests. Autogenerated by default.
   */
  cacheKey?: string;
  /**
   * Key which will be used to queue requests. Autogenerated by default.
   */
  queueKey?: string;
  /**
   * Key which will be used to use effects. Autogenerated by default.
   */
  effectKey?: string;
  /**
   * Should we deduplicate two requests made at the same time into one
   */
  deduplicate?: boolean;
  /**
   * Time of pooling for the deduplication to be active (default 10ms)
   */
  deduplicateTime?: number;
};

export type PayloadMapperType<Payload> = <NewDataType>(data: Payload) => NewDataType;

export type PayloadType<Payload> = Payload | NegativeTypes;

export type RequestCurrentType<
  Payload,
  QueryParams,
  GenericEndpoint extends string,
  AdapterOptions,
  MethodsType = HttpMethodsType,
> = {
  used?: boolean;
  params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes;
  queryParams?: QueryParams | NegativeTypes;
  data?: PayloadType<Payload>;
  headers?: HeadersInit;
  updatedAbortKey?: boolean;
  updatedCacheKey?: boolean;
  updatedQueueKey?: boolean;
  updatedEffectKey?: boolean;
} & Partial<NullableKeys<RequestOptionsType<GenericEndpoint, AdapterOptions, MethodsType>>>;

export type ParamType = string | number;
export type ParamsType = Record<string, ParamType>;

export type ExtractRouteParams<T extends string> = string extends T
  ? NegativeTypes
  : T extends `${string}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  : T extends `${string}:${infer Param}`
  ? { [k in Param]: ParamType }
  : NegativeTypes;

export type FetchOptionsType<AdapterOptions> = Omit<
  Partial<RequestOptionsType<string, AdapterOptions>>,
  "endpoint" | "method"
>;

/**
 * It will check if the query params are already set
 */
export type FetchQueryParamsType<QueryParams, HasQuery extends true | false = false> = HasQuery extends true
  ? { queryParams?: NegativeTypes }
  : {
      queryParams?: QueryParams;
    };

/**
 * If the request endpoint parameters are not filled it will throw an error
 */
export type FetchParamsType<
  Endpoint extends string,
  HasParams extends true | false,
> = ExtractRouteParams<Endpoint> extends NegativeTypes
  ? { params?: NegativeTypes }
  : HasParams extends true
  ? { params?: NegativeTypes }
  : { params: NonNullable<ExtractRouteParams<Endpoint>> };

/**
 * If the request data is not filled it will throw an error
 */
export type FetchPayloadType<Payload, HasData extends true | false> = Payload extends NegativeTypes
  ? { data?: NegativeTypes }
  : HasData extends true
  ? { data?: NegativeTypes }
  : { data: NonNullable<Payload> };

export type RequestQueueOptions = {
  dispatcherType?: "auto" | "fetch" | "submit";
};

// Request making

export type RequestSendOptionsType<Request extends RequestInstance> = FetchQueryParamsType<
  ExtractRequestQueryParamsType<Request>,
  ExtractHasQueryParamsType<Request>
> &
  FetchParamsType<ExtractEndpointType<Request>, ExtractHasParamsType<Request>> &
  FetchPayloadType<ExtractPayloadType<Request>, ExtractHasDataType<Request>> &
  Omit<FetchOptionsType<ExtractAdapterType<Request>>, "params" | "data"> &
  FetchSendActionsType<Request> &
  RequestQueueOptions;

export type FetchSendActionsType<Request extends RequestInstance> = {
  onSettle?: (requestId: string, request: Request) => void;
  onRequestStart?: (details: RequestEventType<Request>) => void;
  onResponseStart?: (details: RequestEventType<Request>) => void;
  onUploadProgress?: (values: ProgressType, details: RequestEventType<Request>) => void;
  onDownloadProgress?: (values: ProgressType, details: RequestEventType<Request>) => void;
  onResponse?: (
    response: ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>,
    details: ResponseDetailsType,
  ) => void;
  onRemove?: (details: RequestEventType<Request>) => void;
};

export type RequestSendType<Request extends RequestInstance> =
  RequestSendOptionsType<Request>["data"] extends NegativeTypes
    ? RequestSendOptionsType<Request>["params"] extends NegativeTypes
      ? (
          options?: RequestSendOptionsType<Request>,
        ) => Promise<
          ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>
        >
      : (
          options?: RequestSendOptionsType<Request>,
        ) => Promise<
          ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>
        >
    : (
        options?: RequestSendOptionsType<Request>,
      ) => Promise<
        ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>
      >;

export type RequestMockType<Response> = {
  data: Response | Response[] | (() => Response);
  config?: {
    status?: number;
    responseDelay?: number;
    requestSentDuration?: number;
    responseReceivedDuration?: number;
  };
};

export type RequestDataMockTypes<Response, Request extends RequestInstance> =
  | RequestMockType<Response>
  | RequestMockType<Response>[]
  | ((r: Request) => RequestMockType<Response>)
  | ((r: Request) => RequestMockType<Response>)[]
  | ((r: Request) => Promise<RequestMockType<Response>>)
  | ((r: Request) => Promise<RequestMockType<Response>>)[];

export type GeneratorReturnMockTypes<Response, Request extends RequestInstance> =
  | RequestMockType<Response>
  | ((r: Request) => RequestMockType<Response>)
  | ((r: Request) => Promise<RequestMockType<Response>>);

// Instance

export type RequestInstance = Request<
  any,
  any,
  any,
  any,
  any,
  any,
  BaseAdapterType<any, any, any, any, any>,
  any,
  any,
  any
>;
