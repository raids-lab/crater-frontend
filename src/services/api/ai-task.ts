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
import { apiV1Get } from '@/services/client'

import { V1ResourceList } from '@/utils/resource'
import { showErrorToast } from '@/utils/toast'

import { IResponse } from '../types'

export interface IAiTask {
  id: number
  taskName: string
  userName: string
  namespace: string
  taskType: string
  createdAt: string
  updatedAt: string
  admittedAt: string
  startedAt: string
  finishAt: string
  duration: number
  jct: number
  image: string
  resourceRequest: string
  workingDir: string
  ShareDirs: string[]
  command: string
  args: string
  slo: number
  status: string
  jobName: string
  isDeleted: boolean
  profileStatus: number
  profileStat: string
  estimatedTime: number
  scheduleInfo: string
}

export interface ProfileStat {
  gpu_util_avg: number //上限1
  gpu_util_max: number //上限1
  gpu_util_std: number
  sm_active_avg: number //上限1
  sm_active_max: number //上限1
  sm_util_std: number
  sm_occupancy_avg: number //上限1
  sm_occupancy_max: number
  sm_occupancy_std: number
  dram_util_avg: number //上限1
  dram_util_max: number
  dram_util_std: number
  mem_copy_util_avg: number //上限1
  mem_copy_util_max: number
  mem_copy_util_std: number
  pcie_tx_avg: number // 展示数值 MB/s
  pcie_tx_max: number
  pcie_rx_avg: number // 展示数值 MB/s
  pcie_rx_max: number
  cpu_usage_avg: number //展示数值
  gpu_mem_max: number //展示单位MB，上限是32768
  cpu_mem_max: number // 展示单位MB，不用进度条
}

export interface AiTask {
  id: number
  taskName: string
  userName: string
  namespace: string
  taskType: string
  createdAt: string
  updatedAt: string
  admittedAt: string
  startedAt: string
  finishAt: string
  duration: number
  jct: number
  image: string
  resourceRequest: V1ResourceList
  workingDir: string
  ShareDirs: string[]
  command: string
  args: string
  slo: number
  status: string
  jobName: string
  isDeleted: boolean
  profileStatus: number
  profileStat?: ProfileStat
  estimatedTime: number
  scheduleInfo: string
}

export const convertAiTask = (task: IAiTask): AiTask => {
  try {
    const aiTaskINfo: AiTask = {
      ...task,
      resourceRequest: JSON.parse(task.resourceRequest) as V1ResourceList,
      profileStat:
        task.profileStat === '' ? undefined : (JSON.parse(task.profileStat) as ProfileStat),
    }
    return aiTaskINfo
  } catch (e) {
    showErrorToast(e)
    return task as unknown as AiTask
  }
}

export const apiAiTaskGet = (taskID: number) =>
  apiV1Get<IResponse<IAiTask>>('aitask/get', {
    searchParams: {
      taskID,
    },
  })
