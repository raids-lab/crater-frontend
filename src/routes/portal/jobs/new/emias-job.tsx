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
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { t } from 'i18next'
import { useAtomValue } from 'jotai'
import { LayoutGridIcon } from 'lucide-react'
import { CirclePlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import LoadableButton from '@/components/button/loadable-button'
import { VolumeMountsCard } from '@/components/form/DataMountFormField'
import { EnvFormCard } from '@/components/form/EnvFormField'
import FormExportButton from '@/components/form/FormExportButton'
import FormImportButton from '@/components/form/FormImportButton'
import FormLabelMust from '@/components/form/FormLabelMust'
import { ImageFormField } from '@/components/form/ImageFormField'
import { OtherOptionsFormCard } from '@/components/form/OtherOptionsFormField'
import { ResourceFormFields } from '@/components/form/ResourceFormField'
import { TemplateInfo } from '@/components/form/TemplateInfo'
import { MetadataFormCustom } from '@/components/form/types'
import { publishValidateSearch } from '@/components/job/publish'
import CardTitle from '@/components/label/CardTitle'
import PageTitle from '@/components/layout/page-title'

import { ITrainingCreate, apiTrainingCreate } from '@/services/api/vcjob'

import {
  VolumeMountType,
  convertToResourceList,
  defaultResource,
  envsSchema,
  exportToJsonString,
  forwardsSchema,
  jobNameSchema,
  nodeSelectorSchema,
  taskSchema,
  volumeMountsSchema,
} from '@/utils/form'
import { atomUserInfo } from '@/utils/store'

export const Route = createFileRoute('/portal/jobs/new/emias-job')({
  validateSearch: publishValidateSearch,
  component: RouteComponent,
  loader: () => {
    return {
      crumb: t('jobs.new.emiasJob'),
    }
  },
})

const VERSION = '20240528'
const JOB_TYPE = 'single'

const formSchema = z.object({
  jobName: jobNameSchema,
  task: taskSchema,
  priority: z.enum(['low', 'high'], {
    invalid_type_error: '请选择任务优先级',
    required_error: '请选择任务优先级',
  }),
  envs: envsSchema,
  volumeMounts: volumeMountsSchema,
  nodeSelector: nodeSelectorSchema,
  forwards: forwardsSchema,
  alertEnabled: z.boolean().default(true),
})

type FormSchema = z.infer<typeof formSchema>

const dataProcessor = (data: FormSchema) => {
  // 处理镜像字段兼容性（将旧的字符串格式转换为新的对象格式）
  if (data.task.image && typeof data.task.image === 'string') {
    data.task.image = {
      imageLink: data.task.image,
      archs: ['linux/amd64'],
    }
  } else if (
    data.task.image &&
    typeof data.task.image === 'object' &&
    'imageLink' in data.task.image &&
    !('archs' in data.task.image)
  ) {
    const imageObj = data.task.image as { imageLink: string }
    data.task.image = {
      imageLink: imageObj.imageLink,
      archs: ['linux/amd64'],
    }
  }

  // 转换数据格式，确保forwards字段存在
  if (data.forwards === undefined || data.forwards === null) {
    data.forwards = []
  }
  // if rdma is enabled, set it to false
  if (data.task.resource.network) {
    data.task.resource.network.enabled = false
    data.task.resource.network.model = undefined
  }
  if (!data.task.resource.network) {
    data.task.resource.network = {
      enabled: false,
      model: undefined,
    }
  }
  if (!data.task.resource.vgpu) {
    data.task.resource.vgpu = {
      enabled: false,
    }
  }
  return data
}

const markdown = `## 单机训练作业

单机训练作业适用于各类深度学习训练任务，支持GPU资源申请，可灵活配置环境变量和数据挂载。

## 运行规则

1. 如果申请了 GPU 资源，当过去 2 个小时 GPU 利用率为 0，我们将尝试发送告警信息给用户，建议用户检查作业是否正常运行。若此后半小时 GPU 利用率仍为 0，**系统将释放作业占用的资源**。
2. 当作业运行超过 4 天，我们将尝试发送告警信息给用户，提醒用户作业运行时间过长；若此后一天内用户未联系管理员说明情况并锁定作业，**系统将释放作业占用的资源**。`

function RouteComponent() {
  const searchParams = Route.useSearch()
  const [envOpen, setEnvOpen] = useState<boolean>(false)
  const [otherOpen, setOtherOpen] = useState<boolean>(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAtomValue(atomUserInfo)

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: (values: FormSchema) =>
      apiTrainingCreate({
        name: values.jobName,
        slo: values.priority === 'high' ? 1 : 0,
        resource: convertToResourceList(values.task.resource),
        image: values.task.image,
        command: values.task.command,
        workingDir: values.task.workingDir,
        volumeMounts: values.volumeMounts,
        envs: values.envs,
        forwards: values.forwards,
        alertEnabled: values.alertEnabled,
        selectors: values.nodeSelector.enable
          ? [
              {
                key: 'kubernetes.io/hostname',
                operator: 'In',
                values: [`${values.nodeSelector.nodeName}`],
              },
            ]
          : undefined,
        template: exportToJsonString(MetadataFormCustom, values),
      } as ITrainingCreate),
    onSuccess: async (_, { jobName }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job'] }),
        queryClient.invalidateQueries({ queryKey: ['context', 'quota'] }),
        queryClient.invalidateQueries({ queryKey: ['aitask', 'stats'] }),
      ])
      toast.success(`作业 ${jobName} 创建成功`)
      router.history.back()
    },
  })

  // 1. 定义表单
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobName: '',
      task: {
        taskName: 'training',
        replicas: 1,
        resource: defaultResource,
        image: {
          imageLink: '',
          archs: [],
        },
        command: '',
        workingDir: '/home/' + user?.name,
        ports: [],
      },
      volumeMounts: [
        {
          type: VolumeMountType.FileType,
          subPath: 'user',
          mountPath: `/home/${user?.name}`,
        },
      ],
      envs: [],
      nodeSelector: {
        enable: false,
      },
      alertEnabled: true,
      forwards: [],
    },
  })

  // 使用通用模板加载器
  const onSubmit = (values: FormSchema) => {
    if (isPending) {
      toast.info('请勿重复提交')
      return
    }
    createTask(values)
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid flex-1 items-start gap-4 md:gap-x-6 lg:grid-cols-3"
        >
          <PageTitle
            title="单机训练作业"
            description="适用于各类深度学习训练任务"
            className="lg:col-span-3"
            tipContent={`版本 ${VERSION}`}
          >
            <div className="items-centor flex w-fit flex-row justify-end gap-3">
              <FormImportButton
                metadata={{ version: VERSION, type: JOB_TYPE }}
                form={form}
                dataProcessor={dataProcessor}
                afterImport={(data) => {
                  if (data.envs.length > 0) {
                    setEnvOpen(true)
                  }
                  if (data.nodeSelector.enable) {
                    setOtherOpen(true)
                  }
                }}
              />
              <FormExportButton metadata={{ version: VERSION, type: JOB_TYPE }} form={form} />
              <LoadableButton isLoading={isPending} isLoadingText="提交作业" type="submit">
                <CirclePlus className="size-4" />
                提交作业
              </LoadableButton>
            </div>
          </PageTitle>

          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle icon={LayoutGridIcon}>基本设置</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <FormField
                  control={form.control}
                  name="jobName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        作业名称
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>名称可重复，最多包含 40 个字符</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ResourceFormFields
                  form={form}
                  cpuPath="task.resource.cpu"
                  memoryPath="task.resource.memory"
                  gpuCountPath="task.resource.gpu.count"
                  gpuModelPath="task.resource.gpu.model"
                />

                <ImageFormField form={form} name="task.image" />
                <FormField
                  control={form.control}
                  name="task.command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        启动命令
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} className="h-24 font-mono" />
                      </FormControl>
                      <FormDescription>
                        将覆盖镜像的启动命令，可通过 <span className="font-mono">;</span>{' '}
                        拆分多行命令
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="task.workingDir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        工作目录
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" />
                      </FormControl>
                      <FormDescription>
                        用户文件夹位于 <span className="font-mono">/home/{user?.name}</span>
                        ，重启后数据不会丢失
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        任务优先级
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="">
                            <SelectValue placeholder="请选择" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">高优先级</SelectItem>
                            <SelectItem value="low">低优先级</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <TemplateInfo
              form={form}
              metadata={{ version: VERSION, type: JOB_TYPE }}
              uiStateUpdaters={[
                {
                  condition: (data) => data.envs.length > 0,
                  setter: setEnvOpen,
                  value: true,
                },
                {
                  condition: (data) => data.nodeSelector.enable || !data.alertEnabled,
                  setter: setOtherOpen,
                  value: true,
                },
              ]}
              searchParams={searchParams}
              dataProcessor={dataProcessor}
              defaultMarkdown={markdown}
            />
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            <VolumeMountsCard form={form} />
            <EnvFormCard form={form} open={envOpen} setOpen={setEnvOpen} />
            <OtherOptionsFormCard
              form={form}
              alertEnabledPath="alertEnabled"
              nodeSelectorEnablePath="nodeSelector.enable"
              nodeSelectorNodeNamePath="nodeSelector.nodeName"
              open={otherOpen}
              setOpen={setOtherOpen}
            />
          </div>
        </form>
      </Form>
    </>
  )
}
