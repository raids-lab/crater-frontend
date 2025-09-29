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
import { JobType } from '@/services/api/vcjob'

import { PhaseBadge } from './phase-badge'

export const jobTypes = [
  {
    value: 'custom',
    label: 'Custom',
  },
  {
    value: 'jupyter',
    label: 'Jupyter',
  },
  {
    value: 'tensorflow',
    label: 'Tensorflow',
  },
  {
    value: 'pytorch',
    label: 'Pytorch',
  },
]

const getJobTypeLabel = (
  phase: JobType
): {
  label: string
  color: string
  description: string
} => {
  switch (phase) {
    case JobType.Custom:
      return {
        label: 'Custom',
        color: 'text-highlight-purple bg-highlight-purple/10',
        description: '自定义作业',
      }
    case JobType.Jupyter:
      return {
        label: 'Jupyter',
        color: 'text-highlight-amber bg-highlight-amber/10',
        description: 'Jupyter 交互式作业',
      }
    case JobType.Tensorflow:
      return {
        label: 'Tensorflow',
        color: 'text-highlight-cyan bg-highlight-cyan/10',
        description: 'TensorFlow PS 作业',
      }
    case JobType.Pytorch:
      return {
        label: 'Pytorch',
        color: 'text-highlight-rose bg-highlight-rose/10',
        description: 'Pytorch DDP 作业',
      }
    default:
      return {
        label: 'Custom',
        color: 'text-highlight-purple bg-highlight-purple/10',
        description: '自定义作业',
      }
  }
}

const JobTypeLabel = ({ jobType }: { jobType: JobType }) => {
  return <PhaseBadge phase={jobType} getPhaseLabel={getJobTypeLabel} />
}

export default JobTypeLabel
