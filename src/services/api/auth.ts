/**
 * Copyright 2025 RAIDS Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import instance, { VERSION } from '../axios'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/store'
import { IResponse } from '../types'
import { IUserAttributes } from './admin/user'

/**
 * Signup
 */
export interface ISignup {
  userName: string
  password: string
}

/**
 * Login
 */
export interface ILogin {
  auth: string
  token?: string
  username?: string
  password?: string
}

// const (
// 	RoleGuest Role = iota
// 	RoleUser
// 	RoleAdmin
// )
export enum Role {
  Guest = 1,
  User,
  Admin,
}

export enum AccessMode {
  NotAllowed = 1,
  ReadOnly,
  ReadWrite,
}

export interface AccountContext {
  queue: string
  roleQueue: Role
  rolePlatform: Role
  accessQueue: AccessMode
  accessPublic: AccessMode
  space: string
}

export interface IAuthResponse {
  accessToken: string
  refreshToken: string
  user: IUserAttributes
  context: AccountContext
}

export const apiUserSignup = async (user: ISignup) => {
  const response = await instance.post<IAuthResponse>('auth/signup', user)
  return response.data
}

export const apiUserLogin = async (user: ILogin) => {
  const response = await instance.post<IResponse<IAuthResponse>>('auth/login', user)
  const { accessToken, refreshToken } = response.data.data
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  return response.data.data
}

export const apiQueueSwitch = async (queue: string) => {
  const response = await instance.post<IResponse<IAuthResponse>>(VERSION + '/auth/switch', {
    queue,
  })
  if (response.status === 200) {
    const { accessToken, refreshToken } = response.data.data
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
  return response.data.data
}
