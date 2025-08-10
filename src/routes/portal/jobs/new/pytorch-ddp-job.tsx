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
import { createFileRoute } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { t } from 'i18next'
import { useAtomValue } from 'jotai'
import { HammerIcon, LayoutGridIcon, PickaxeIcon } from 'lucide-react'
import { CirclePlus, CirclePlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
import { MetadataFormPytorch } from '@/components/form/types'
import { publishValidateSearch } from '@/components/job/publish'
import { PublishConfigForm } from '@/components/job/publish'
import CardTitle from '@/components/label/CardTitle'
import PageTitle from '@/components/layout/page-title'

import { apiPytorchCreate } from '@/services/api/vcjob'

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

export const Route = createFileRoute('/portal/jobs/new/pytorch-ddp-job')({
  validateSearch: publishValidateSearch,
  component: RouteComponent,
  loader: () => {
    return {
      crumb: t('jobs.new.pytorchDDPJob'),
    }
  },
})

const markdown = `## 运行规则

2. 如果申请了 GPU 资源，当过去 2 个小时 GPU 利用率为 0，我们将尝试发送告警信息给用户，建议用户检查作业是否正常运行。若此后半小时 GPU 利用率仍为 0，**系统将释放作业占用的资源**。
3. 当作业运行超过 4 天，我们将尝试发送告警信息给用户，提醒用户作业运行时间过长；若此后一天内用户未联系管理员说明情况并锁定作业，**系统将释放作业占用的资源**。

## 环境变量

Pytorch 分布式作业相比普通的单机作业，在每个容器中都会设置环境变量：

### 1. \`WORLD_SIZE\`
- **作用**：表示参与分布式训练的进程总数（所有节点上的总进程数）。
- **示例**：\`WORLD_SIZE=2\` 表示总共有 2 个进程参与训练。

### 2. \`MASTER_ADDR\`
- **作用**：指定主节点（rank 0 的节点）的地址（通常是主机名或 IP 地址）。
- **示例**：\`MASTER_ADDR=py-liyilong-670a0-master-0.py-liyilong-670a0\` 表示主节点的主机名。Ray Worker 可以使用这个地址加入 Ray Head。

### 3. \`MASTER_PORT\`
- **作用**：指定主节点用于通信的端口号（所有节点需一致）。
- **示例**：\`MASTER_PORT=23456\` 表示使用 23456 端口进行进程间通信。

### 4. \`RANK\`
- **作用**：表示当前进程的全局唯一标识（从 0 到 \`WORLD_SIZE-1\`）。主节点的 \`RANK\` 必须为 0。
- **示例**：如果 \`RANK=0\`，表示当前进程是主进程。

这些变量是 PyTorch 分布式训练（如 \`torch.distributed.launch\` 或 \`torchrun\`）的核心配置，用于：
1. **初始化进程组**：通过 \`torch.distributed.init_process_group\` 实现多进程协作。
2. **协调通信**：确保所有进程能正确连接到主节点（\`MASTER_ADDR:MASTER_PORT\`）。
3. **数据并行**：结合 \`DistributedDataParallel\` (DDP) 实现多 GPU/多节点训练。

例如：

\`\`\`python
import torch.distributed as dist

dist.init_process_group(
    backend="nccl",  # 或 "gloo"
    init_method=f"tcp://{os.environ['MASTER_ADDR']}:{os.environ['MASTER_PORT']}",
    world_size=int(os.environ['WORLD_SIZE']),
    rank=int(os.environ['RANK'])
)
\`\`\`

## 以普通用户运行

自定义作业默认以 \`root\` 用户运行，这种情况下，由于 Jupyter 交互式作业默认以普通用户运行，可能会导致权限问题。

为了帮助您以普通用户运行自定义作业，我们在容器内注入了 \`/crater-start.sh\` 脚本，您可以通过以下方式使用：

### 方法1：直接执行命令
在批处理命令前加上脚本调用：
\`\`\`bash
/crater-start.sh python your_script.py
\`\`\`

### 方法2：多步骤执行
执行脚本后，指定以普通用户权限运行命令，若直接执行命令，则仍以root权限执行：
\`\`\`bash
/crater-start.sh
su - \${NB_USER} -c 'your_command_1'
su - \${NB_USER} -c 'your_command_2'
...
\`\`\`

## RDMA

如果需要使用 RDMA，请先申请 GPU，之后在作业配置中启用 RDMA 选项。

启用后，CPU 和内存限制将被忽略。请注意，RDMA 资源配置必须在所有角色中保持一致。

相关文档有待补充。
`

const formSchema = z.object({
  jobName: jobNameSchema,
  ps: taskSchema,
  worker: taskSchema,
  envs: envsSchema,
  volumeMounts: volumeMountsSchema,
  alertEnabled: z.boolean().default(true),
  nodeSelector: nodeSelectorSchema,
  forwards: forwardsSchema,
})

type FormSchema = z.infer<typeof formSchema>

const dataProcessor = (data: FormSchema) => {
  // Convert forwards to a format suitable for the API
  if (data.forwards === undefined || data.forwards === null) {
    data.forwards = []
  }
  if (!data.ps.resource.network) {
    data.ps.resource.network = {
      enabled: false,
      model: undefined,
    }
  }
  if (!data.worker.resource.network) {
    data.worker.resource.network = {
      enabled: false,
      model: undefined,
    }
  }
  return data
}

function RouteComponent() {
  const searchParams = Route.useSearch()
  const [envOpen, setEnvOpen] = useState<boolean>(false)
  const [otherOpen, setOtherOpen] = useState<boolean>(true)
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAtomValue(atomUserInfo)

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: (values: FormSchema) =>
      apiPytorchCreate({
        name: values.jobName,
        tasks: [
          {
            name: values.ps.taskName,
            replicas: values.ps.replicas,
            resource: convertToResourceList(values.ps.resource),
            image: values.ps.image,
            command: values.ps.command,
            workingDir: values.ps.workingDir,
            ports: values.ps.ports,
          },
          {
            name: values.worker.taskName,
            replicas: values.worker.replicas,
            resource: convertToResourceList(values.worker.resource),
            image: values.worker.image,
            command: values.worker.command,
            workingDir: values.worker.workingDir,
            ports: values.worker.ports,
          },
        ],
        volumeMounts: values.volumeMounts,
        envs: values.envs,
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
        template: exportToJsonString(MetadataFormPytorch, values),
        forwards: values.forwards,
      }),
    onSuccess: async (_, { jobName: taskname }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job'] }),
        queryClient.invalidateQueries({ queryKey: ['context', 'quota'] }),
        queryClient.invalidateQueries({ queryKey: ['aitask', 'stats'] }),
      ])
      toast.success(`作业 ${taskname} 创建成功`)
      router.history.back()
    },
  })

  // 1. Define your form.
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobName: '',
      ps: {
        taskName: 'master',
        replicas: 1,
        resource: defaultResource,
        image: '',
        ports: [],
      },
      worker: {
        taskName: 'worker',
        replicas: 1,
        resource: defaultResource,
        image: '',
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
      alertEnabled: true,
      nodeSelector: {
        enable: false,
      },
    },
  })

  const {
    fields: psPortFields,
    append: psPortAppend,
    remove: psPortRemove,
  } = useFieldArray<FormSchema>({
    name: 'ps.ports',
    control: form.control,
  })

  const {
    fields: workerPortFields,
    append: workerPortAppend,
    remove: workerPortRemove,
  } = useFieldArray<FormSchema>({
    name: 'worker.ports',
    control: form.control,
  })

  // 2. Define a submit handler.
  const onSubmit = (values: FormSchema) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    if (isPending) {
      toast.info('请勿重复提交')
      return
    }
    if (
      values.ps.resource.network.enabled !== values.worker.resource.network.enabled ||
      (values.ps.resource.network.enabled &&
        values.ps.resource.network.model !== values.worker.resource.network.model)
    ) {
      form.setError('ps.resource.network.model', {
        type: 'manual',
        message: 'RDMA 资源配置必须在所有角色中保持一致',
      })
      form.setError('worker.resource.network.model', {
        type: 'manual',
        message: 'RDMA 资源配置必须在所有角色中保持一致',
      })
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
            title="Pytorch DDP 作业"
            description="创建基于 Pytorch 框架的分布式训练作业"
            className="lg:col-span-3"
            tipContent={`版本 ${MetadataFormPytorch.version}`}
          >
            <div className="items-centor flex w-fit flex-row justify-end gap-3">
              <FormImportButton
                metadata={MetadataFormPytorch}
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
              <FormExportButton metadata={MetadataFormPytorch} form={form} />
              <PublishConfigForm
                config={MetadataFormPytorch}
                configform={form}
                fromTemplate={searchParams.fromTemplate}
              />
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle icon={HammerIcon}>Master</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <FormField
                  control={form.control}
                  name="ps.replicas"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        副本数
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...form.register('ps.replicas', {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ResourceFormFields
                  form={form}
                  cpuPath="ps.resource.cpu"
                  memoryPath="ps.resource.memory"
                  gpuCountPath="ps.resource.gpu.count"
                  gpuModelPath="ps.resource.gpu.model"
                  rdmaPath={{
                    rdmaEnabled: 'ps.resource.network.enabled',
                    rdmaLabel: 'ps.resource.network.model',
                  }}
                />
                <ImageFormField form={form} name="ps.image" />
                <FormField
                  control={form.control}
                  name="ps.command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>启动命令</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="h-24 font-mono" />
                      </FormControl>
                      <FormDescription>
                        如果设置，将覆盖镜像的启动命令，可通过 <span className="font-mono">;</span>{' '}
                        拆分多行命令
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ps.workingDir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作目录</FormLabel>
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
                <div className="space-y-2">
                  {psPortFields.length > 0 && (
                    <div>
                      <FormLabel>端口</FormLabel>
                    </div>
                  )}
                  {psPortFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`ps.ports.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="端口名称" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`ps.ports.${index}.port`}
                        render={() => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="端口号"
                                {...form.register(`ps.ports.${index}.port`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        onClick={() => psPortRemove(index)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => psPortAppend({ name: '', port: 0 })}
                  >
                    <CirclePlusIcon className="size-4" />
                    添加端口
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle icon={PickaxeIcon}>Worker</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <FormField
                  control={form.control}
                  name="worker.replicas"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        副本数
                        <FormLabelMust />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...form.register('worker.replicas', {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ResourceFormFields
                  form={form}
                  cpuPath="worker.resource.cpu"
                  memoryPath="worker.resource.memory"
                  gpuCountPath="worker.resource.gpu.count"
                  gpuModelPath="worker.resource.gpu.model"
                  rdmaPath={{
                    rdmaEnabled: 'worker.resource.network.enabled',
                    rdmaLabel: 'worker.resource.network.model',
                  }}
                />
                <ImageFormField form={form} name="worker.image" />
                <FormField
                  control={form.control}
                  name="worker.command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>启动命令</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="h-24 font-mono" />
                      </FormControl>
                      <FormDescription>
                        如果设置，将覆盖镜像的启动命令，可通过 <span className="font-mono">;</span>{' '}
                        拆分多行命令
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="worker.workingDir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作目录</FormLabel>
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
                <div className="space-y-2">
                  {workerPortFields.length > 0 && (
                    <div>
                      <FormLabel>端口</FormLabel>
                    </div>
                  )}
                  {workerPortFields.map(({ id }, index) => (
                    <div key={id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`worker.ports.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="端口名称" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`worker.ports.${index}.port`}
                        render={() => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="端口号"
                                {...form.register(`worker.ports.${index}.port`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button size="icon" variant="outline" onClick={() => workerPortRemove(index)}>
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => workerPortAppend({ name: '', port: 0 })}
                  >
                    <CirclePlusIcon className="size-4" />
                    添加端口
                  </Button>
                </div>
              </CardContent>
            </Card>

            <TemplateInfo
              form={form}
              metadata={MetadataFormPytorch}
              searchParams={searchParams}
              uiStateUpdaters={[
                {
                  condition: (data) => data.envs.length > 0,
                  setter: setEnvOpen,
                  value: true,
                },
                {
                  condition: (data) => data.nodeSelector.enable || data.alertEnabled,
                  setter: setOtherOpen,
                  value: true,
                },
              ]}
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
