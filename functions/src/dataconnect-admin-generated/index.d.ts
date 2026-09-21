import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateGardenData {
  garden_insert: Garden_Key;
}

export interface CreateGardenVariables {
  birthdayPersonName: string;
  revealDate: DateString;
}

export interface CreateWishData {
  wish_insert: Wish_Key;
}

export interface CreateWishVariables {
  gardenId: UUIDString;
  contentType: string;
  messageBody?: string | null;
}

export interface Garden_Key {
  id: UUIDString;
  __typename?: 'Garden_Key';
}

export interface GetGardenWishesData {
  garden?: {
    wishes_on_garden: ({
      id: UUIDString;
      messageBody?: string | null;
      contentType: string;
      contentUrl?: string | null;
      contributor: {
        displayName: string;
      };
    } & Wish_Key)[];
  };
}

export interface GetGardenWishesVariables {
  gardenId: UUIDString;
}

export interface GetUserGardensData {
  gardens: ({
    id: UUIDString;
    birthdayPersonName: string;
    revealDate: DateString;
    themeColor?: string | null;
  } & Garden_Key)[];
}

export interface Invitation_Key {
  id: UUIDString;
  __typename?: 'Invitation_Key';
}

export interface Notification_Key {
  id: UUIDString;
  __typename?: 'Notification_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Wish_Key {
  id: UUIDString;
  __typename?: 'Wish_Key';
}

/** Generated Node Admin SDK operation action function for the 'GetUserGardens' Query. Allow users to execute without passing in DataConnect. */
export function getUserGardens(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserGardensData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserGardens' Query. Allow users to pass in custom DataConnect instances. */
export function getUserGardens(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserGardensData>>;

/** Generated Node Admin SDK operation action function for the 'GetGardenWishes' Query. Allow users to execute without passing in DataConnect. */
export function getGardenWishes(dc: DataConnect, vars: GetGardenWishesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetGardenWishesData>>;
/** Generated Node Admin SDK operation action function for the 'GetGardenWishes' Query. Allow users to pass in custom DataConnect instances. */
export function getGardenWishes(vars: GetGardenWishesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetGardenWishesData>>;

/** Generated Node Admin SDK operation action function for the 'CreateWish' Mutation. Allow users to execute without passing in DataConnect. */
export function createWish(dc: DataConnect, vars: CreateWishVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWishData>>;
/** Generated Node Admin SDK operation action function for the 'CreateWish' Mutation. Allow users to pass in custom DataConnect instances. */
export function createWish(vars: CreateWishVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWishData>>;

/** Generated Node Admin SDK operation action function for the 'CreateGarden' Mutation. Allow users to execute without passing in DataConnect. */
export function createGarden(dc: DataConnect, vars: CreateGardenVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateGardenData>>;
/** Generated Node Admin SDK operation action function for the 'CreateGarden' Mutation. Allow users to pass in custom DataConnect instances. */
export function createGarden(vars: CreateGardenVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateGardenData>>;

