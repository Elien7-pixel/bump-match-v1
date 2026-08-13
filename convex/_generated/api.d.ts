/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminExport from "../adminExport.js";
import type * as adminFeedbackPage from "../adminFeedbackPage.js";
import type * as adminHiddenUsers from "../adminHiddenUsers.js";
import type * as adminUsers from "../adminUsers.js";
import type * as adminUsersPage from "../adminUsersPage.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as crons from "../crons.js";
import type * as deleteAccount from "../deleteAccount.js";
import type * as dictionary from "../dictionary.js";
import type * as faqContent from "../faqContent.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as names from "../names.js";
import type * as partnerInvites from "../partnerInvites.js";
import type * as pushHelpers from "../pushHelpers.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as search from "../search.js";
import type * as searchHelpers from "../searchHelpers.js";
import type * as submissions from "../submissions.js";
import type * as trending from "../trending.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminExport: typeof adminExport;
  adminFeedbackPage: typeof adminFeedbackPage;
  adminHiddenUsers: typeof adminHiddenUsers;
  adminUsers: typeof adminUsers;
  adminUsersPage: typeof adminUsersPage;
  auth: typeof auth;
  authActions: typeof authActions;
  crons: typeof crons;
  deleteAccount: typeof deleteAccount;
  dictionary: typeof dictionary;
  faqContent: typeof faqContent;
  feedback: typeof feedback;
  http: typeof http;
  names: typeof names;
  partnerInvites: typeof partnerInvites;
  pushHelpers: typeof pushHelpers;
  pushNotifications: typeof pushNotifications;
  search: typeof search;
  searchHelpers: typeof searchHelpers;
  submissions: typeof submissions;
  trending: typeof trending;
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
