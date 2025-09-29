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
import { AppWindowIcon, Cable, Grid, Layers, MemoryStickIcon as Memory } from 'lucide-react'

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface NvidiaGpuInfoProps {
  labels: Record<string, string>
}

export function NvidiaGpuInfoCard({ labels }: NvidiaGpuInfoProps) {
  return (
    <div className="py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-mono text-lg font-bold">
          {labels['nvidia.com/gpu.product']}
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <div className="text-primary-foreground/75 flex items-center space-x-2">
              <Memory className="size-4" />
              <span className="text-sm font-medium">显存</span>
            </div>
            <span className="text-lg font-bold">
              {parseInt(labels['nvidia.com/gpu.memory']) / 1024} GB
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-primary-foreground/75 flex items-center space-x-2">
              <Grid className="size-4" />
              <span className="text-sm font-medium">GPU 数量</span>
            </div>
            <span className="text-lg font-bold">{labels['nvidia.com/gpu.count']}</span>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-primary-foreground/75 flex items-center space-x-2">
              <Layers className="size-4" />
              <span className="text-sm font-medium">架构</span>
            </div>
            <span className="text-lg font-bold capitalize">{labels['nvidia.com/gpu.family']}</span>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-primary-foreground/75 flex items-center space-x-2">
              <Cable className="size-4" />
              <span className="text-sm font-medium">驱动版本</span>
            </div>
            <span className="text-lg font-bold">
              {labels['nvidia.com/cuda.driver-version.full']}
            </span>
          </div>
          {/* CUDA {labels["nvidia.com/cuda.runtime-version.full"]} */}
          <div className="flex flex-col space-y-2">
            <div className="text-primary-foreground/75 flex items-center space-x-2">
              <AppWindowIcon className="size-4" />
              <span className="text-sm font-medium">CUDA</span>
            </div>
            <span className="text-lg font-bold">
              {labels['nvidia.com/cuda.runtime-version.full']}
            </span>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
