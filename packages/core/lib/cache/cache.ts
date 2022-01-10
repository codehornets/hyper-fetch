import EventEmitter from "events";

import { FetchBuilder } from "builder";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents } from "cache";
import { CacheStoreKeyType, CacheValueType, CacheStoreValueType, CacheSetDataType } from "./cache.types";

/**
 * Cache class should be initialized per every command instance(not modified with params or queryParams).
 * This way we create container which contains different requests to the same endpoint.
 * With this segregation of data we can keep paginated data, filtered data, without overriding it between not related fetches.
 * Key for interactions should be generated later in the hooks with getCacheRequestKey util function, which joins the stringified values to create isolated space.
 *
 * Example structure:
 *
 * CacheStore:
 *   endpoint => "GET_/users/1" (cacheKey) :
 *        caches => ["/users/1", {...}], ["/users/1?something=true", {...}], ["/users/1?something=false", {...}]
 *   endpoint => "GET_/users" :
 *        caches => ["/users" (key), {...}], ["/users?page=1", {...}], ["/users?page=2", {...}], ["/users?search=mac", {...}]
 *
 * Why this structure?
 * To allow for easier optimistic approach realization - this way we will have the mapper function that will update, add or remove elements from the same endpoint
 */
export class Cache<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getCacheEvents(this.emitter);

  storage: CacheStorageType = new Map<CacheStoreKeyType, CacheStoreValueType>();

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: CacheOptionsType<ErrorType, ClientOptions>,
  ) {
    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization(this);

    if (this.options?.initialData) {
      Object.keys(this.options.initialData).forEach((key) => {
        if (!this.storage.get(key) && this.options?.initialData?.[key]) {
          this.storage.set(key, this.options?.initialData[key]);
        }
      });
    }
  }

  set = <Response>({
    cacheKey,
    requestKey,
    response,
    retries = 0,
    deepEqual = true,
    isRefreshed = false,
    timestamp = +new Date(),
  }: CacheSetDataType<Response, ErrorType>): void => {
    const cacheEntity = this.storage.get(cacheKey) || {};
    const cachedData = cacheEntity?.[requestKey];
    // We have to compare stored data with deepCompare, this will allow us to limit rerendering
    const equal = deepEqual && this.builder.deepEqual(cachedData?.response, response);

    // Refresh/Retry error is saved separate to not confuse render with having already cached data and refreshed one throwing error
    // Keeping it in separate location let us to handle refreshing errors in different ways
    const refreshError = isRefreshed ? response[1] : null;
    const retryError = retries ? response[1] : null;
    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const dataToSave = getCacheData(cachedData?.response, response, refreshError, retryError);

    const newData: CacheValueType = { response: dataToSave, retries, refreshError, retryError, isRefreshed, timestamp };

    if (!equal) {
      cacheEntity[requestKey] = newData;
      this.storage.set(cacheKey, cacheEntity);
      this.events.set<Response>(requestKey, newData);
    } else {
      this.events.setRefreshed(requestKey);
    }
  };

  get = <Response>(cacheKey: string, requestKey: string): CacheValueType<Response> | undefined => {
    const cacheEntity = this.storage.get(cacheKey);
    const cachedData = cacheEntity?.[requestKey];
    return cachedData as CacheValueType<Response>;
  };

  getResponses = <Response>(cacheKey: string): CacheStoreValueType<Response> | undefined => {
    return this.storage.get(cacheKey) as CacheStoreValueType<Response>;
  };

  deleteEndpoint = (cacheKey: string): void => {
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  deleteResponse = (cacheKey: string, requestKey: string): void => {
    this.events.revalidate(requestKey);
    const cacheEntity = this.storage.get(cacheKey);
    if (cacheEntity) {
      delete cacheEntity[requestKey];
      this.storage.set(cacheKey, cacheEntity);
    }
  };

  clear = (): void => {
    this.storage.clear();
  };
}