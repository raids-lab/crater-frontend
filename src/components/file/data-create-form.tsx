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
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'

import { FileSelectDialog } from '@/components/file/file-select-dialog'
import FormLabelMust from '@/components/form/form-label-must'
import { TagsInput } from '@/components/form/tags-input'
import { SandwichLayout } from '@/components/sheet/sandwich-sheet'

import { apiDatasetCreate } from '@/services/api/dataset'

export const dataFormSchema = z.object({
  datasetName: z
    .string()
    .min(1, {
      message: '名称不能为空',
    })
    .max(256, {
      message: '名称最多包含 256 个字符',
    }),
  describe: z.string(),
  url: z.string(),
  type: z.enum(['dataset', 'model', 'sharefile']),
  tags: z
    .array(
      z.object({
        value: z.string(),
      })
    )
    .optional(),
  weburl: z.string(),
  ispublic: z.boolean().default(true),
  readOnly: z.boolean().default(true),
})

export type DataFormSchema = z.infer<typeof dataFormSchema>

export interface DataCreateFormProps extends React.HTMLAttributes<HTMLDivElement> {
  closeSheet: () => void
  type?: 'dataset' | 'model' | 'sharefile'
}

export function DataCreateForm({ closeSheet, type }: DataCreateFormProps) {
  const queryClient = useQueryClient()
  const dataTypeLabel = (() => {
    switch (type) {
      case 'dataset':
        return '数据集'
      case 'model':
        return '模型'
      case 'sharefile':
        return '共享文件'
      default:
        return '数据集'
    }
  })()
  const { mutate: createImagePack } = useMutation({
    mutationFn: (values: DataFormSchema) =>
      apiDatasetCreate({
        describe: values.describe,
        name: values.datasetName,
        url: values.url,
        type: type ?? 'dataset',
        tags: values.tags?.map((item) => item.value) ?? [],
        weburl: values.weburl,
        ispublic: values.ispublic,
        editable: !values.readOnly,
      }),
    onSuccess: async (_, { datasetName }) => {
      await queryClient.invalidateQueries({
        queryKey: ['data', 'mydataset'],
      })
      toast.success(`${dataTypeLabel} ${datasetName} 创建成功`)
      closeSheet()
    },
  })

  // 1. Define your form.
  const form = useForm<DataFormSchema>({
    resolver: zodResolver(dataFormSchema),
    defaultValues: {
      datasetName: '',
      url: '',
      describe: '',
      type: type ?? 'dataset',
      tags: [],
      weburl: '',
      ispublic: true,
      readOnly: true,
    },
  })
  useEffect(() => {
    if (type === 'sharefile') {
      form.setValue('ispublic', false)
      form.setValue('readOnly', false)
    }
  }, [type, form])

  // 2. Define a submit handler.
  const onSubmit = (values: DataFormSchema) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    createImagePack(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SandwichLayout footer={<Button type="submit">提交数据集</Button>}>
          <FormField
            control={form.control}
            name="datasetName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dataTypeLabel}名称
                  <FormLabelMust />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {/* <FormMessage>请输入仓库地址</FormMessage> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="describe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dataTypeLabel}描述
                  <FormLabelMust />
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>
                      {dataTypeLabel}地址
                      <FormLabelMust />
                    </FormLabel>
                    <FormControl>
                      <FileSelectDialog
                        value={field.value.split('/').pop()}
                        isrw={false}
                        title={`选择${dataTypeLabel}地址`}
                        handleSubmit={(item) => {
                          field.onChange(item.id)
                          form.setValue('url', item.id)
                        }}
                      />
                    </FormControl>
                    <FormDescription>请选择文件或文件夹</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          {type !== 'sharefile' && (
            <TagsInput
              form={form}
              tagsPath="tags"
              label={`${dataTypeLabel}标签`}
              description={`为${dataTypeLabel}添加标签，以便分类和搜索`}
              customTags={[
                { value: '大语言模型' },
                { value: '数据科学' },
                { value: '自然语言处理' },
                { value: '计算机视觉' },
                { value: '强化学习' },
                { value: 'Llama' },
                { value: 'Qwen' },
                { value: 'DeepSeek' },
              ]}
            />
          )}
          {type !== 'sharefile' && (
            <FormField
              control={form.control}
              name="weburl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dataTypeLabel}仓库地址</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>可提供{dataTypeLabel}开源仓库地址</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {type !== 'sharefile' && (
            <FormField
              control={form.control}
              name="ispublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 space-x-0">
                  <FormLabel className="font-normal">所有用户可见</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          )}
        </SandwichLayout>
      </form>
    </Form>
  )
}
