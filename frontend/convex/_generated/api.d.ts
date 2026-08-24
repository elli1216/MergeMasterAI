/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as chat from "../chat.js";
import type * as customPolicies from "../customPolicies.js";
import type * as embeddings from "../embeddings.js";
import type * as github from "../github.js";
import type * as myFunctions from "../myFunctions.js";
import type * as pullRequests from "../pullRequests.js";
import type * as repositories from "../repositories.js";
import type * as routingRules from "../routingRules.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  chat: typeof chat;
  customPolicies: typeof customPolicies;
  embeddings: typeof embeddings;
  github: typeof github;
  myFunctions: typeof myFunctions;
  pullRequests: typeof pullRequests;
  repositories: typeof repositories;
  routingRules: typeof routingRules;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
