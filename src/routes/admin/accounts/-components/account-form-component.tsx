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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { CalendarIcon, CirclePlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import LoadableButton from '@/components/button/loadable-button'
import SelectBox from '@/components/custom/select-box'
import FormExportButton from '@/components/form/form-export-button'
import FormImportButton from '@/components/form/form-import-button'
import FormLabelMust from '@/components/form/form-label-must'
import { MetadataFormAccount } from '@/components/form/types'
import { SandwichLayout } from '@/components/sheet/sandwich-sheet'

import { IAccount, apiAccountCreate, apiAccountUpdate } from '@/services/api/account'
import { apiAdminUserList } from '@/services/api/admin/user'
import { apiResourceList } from '@/services/api/resource'

import { convertFormToQuota } from '@/utils/quota'
import { globalSettings } from '@/utils/store'

import { cn } from '@/lib/utils'

import { AccountFormSchema, formSchema } from './account-form'

interface AccountFormProps {
  onOpenChange: (open: boolean) => void
  account?: IAccount | null
}

export const AccountForm = ({ onOpenChange, account }: AccountFormProps) => {
  const { scheduler } = useAtomValue(globalSettings)
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [cachedFormName, setCachedFormName] = useState<string | null>(null)

  const { data: userList } = useQuery({
    queryKey: ['admin', 'userlist'],
    queryFn: apiAdminUserList,
    select: (res) =>
      res.data.map((user) => ({
        value: user.id.toString(),
        label: user.attributes.nickname || user.name,
        labelNote: user.name,
      })),
  })

  const { data: resourceDimension } = useQuery({
    queryKey: ['resources', 'list'],
    queryFn: () => apiResourceList(false),
    select: (res) => {
      return res.data
        .map((item) => item.name)
        .filter(
          (name) =>
            name != 'ephemeral-storage' &&
            name != 'hugepages-1Gi' &&
            name != 'hugepages-2Mi' &&
            name != 'pods'
        )
        .sort(
          // cpu > memory > xx/xx > pods
          (a, b) => {
            if (a === 'cpu') {
              return -1
            }
            if (b === 'cpu') {
              return 1
            }
            if (a === 'memory') {
              return -1
            }
            if (b === 'memory') {
              return 1
            }
            return a.localeCompare(b)
          }
        )
    },
  })

  // 1. Define your form.
  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.nickname || '',
      resources: resourceDimension?.map((name) => ({ name })) || [
        { name: 'cpu' },
        { name: 'memory' },
      ],
      expiredAt: account?.expiredAt ? new Date(account.expiredAt) : undefined,
      admins: [],
      ...(account ? { id: account.id } : {}),
    },
  })

  const currentValues = form.watch()

  const {
    fields: resourcesFields,
    append: resourcesAppend,
    remove: resourcesRemove,
  } = useFieldArray<AccountFormSchema>({
    name: 'resources',
    control: form.control,
  })

  const { mutate: createAccount, isPending: isCreatePending } = useMutation({
    mutationFn: (values: AccountFormSchema) =>
      apiAccountCreate({
        name: values.name,
        quota: convertFormToQuota(values.resources),
        expiredAt: values.expiredAt,
        admins: values.admins?.map((id) => parseInt(id)),
        withoutVolcano: scheduler !== 'volcano',
      }),
    onSuccess: async (_, { name }) => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'accounts'],
      })
      toast.success(t('toast.accountCreated', { name }))
      onOpenChange(false)
    },
  })

  const { mutate: updateAccount, isPending: isUpdatePending } = useMutation({
    mutationFn: (values: AccountFormSchema) =>
      apiAccountUpdate(values.id ?? 0, {
        name: values.name,
        quota: convertFormToQuota(values.resources),
        expiredAt: values.expiredAt,
        admins: values.admins?.map((id) => parseInt(id)),
        withoutVolcano: scheduler !== 'volcano',
      }),
    onSuccess: async (_, { name }) => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'accounts'],
      })
      toast.success(t('toast.accountUpdated', { name }))
      onOpenChange(false)
    },
  })

  // 2. Define a submit handler.
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    if (values.id) {
      updateAccount(values)
    } else {
      createAccount(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <SandwichLayout
          footer={
            <>
              <FormImportButton
                form={form}
                metadata={MetadataFormAccount}
                beforeImport={(data) => {
                  setCachedFormName(data.name)
                }}
                afterImport={() => {
                  if (cachedFormName) {
                    form.setValue('name', cachedFormName)
                    form.setValue('expiredAt', undefined)
                  }
                  setCachedFormName(null)
                }}
              />
              <FormExportButton form={form} metadata={MetadataFormAccount} />
              <LoadableButton
                isLoading={isCreatePending || isUpdatePending}
                isLoadingText={
                  form.getValues('id')
                    ? t('accountForm.updateButton')
                    : t('accountForm.createButton')
                }
                type="submit"
              >
                <CirclePlusIcon className="size-4" />
                {form.getValues('id')
                  ? t('accountForm.updateButton')
                  : t('accountForm.createButton')}
              </LoadableButton>
            </>
          }
        >
          <div className="flex flex-row items-start justify-between gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-1 grow">
                  <FormLabel>
                    {t('accountForm.nameLabel')}
                    <FormLabelMust />
                  </FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} className="w-full" autoFocus={true} />
                  </FormControl>
                  <FormDescription>{t('accountForm.nameDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiredAt"
              render={({ field }) => (
                <FormItem className="col-span-1 flex flex-col">
                  <FormLabel>{t('accountForm.expiredAtLabel')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', {
                              locale: zhCN,
                            })
                          ) : (
                            <span>{t('accountForm.expiredAtPlaceholder')}</span>
                          )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={zhCN}
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>{t('accountForm.expiredAtDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {!form.getValues('id') && (
            <FormField
              control={form.control}
              name="admins"
              render={() => (
                <FormItem>
                  <FormLabel>
                    {t('accountForm.adminsLabel')}
                    <FormLabelMust />
                  </FormLabel>
                  <FormControl>
                    <SelectBox
                      className="my-0 h-8"
                      options={userList ?? []}
                      inputPlaceholder={t('accountForm.adminsSearchPlaceholder')}
                      placeholder={t('accountForm.adminsPlaceholder')}
                      value={currentValues.admins}
                      onChange={(value) => form.setValue('admins', value)}
                    />
                  </FormControl>
                  <FormDescription>{t('accountForm.adminsDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="space-y-2">
            {resourcesFields.length > 0 && <FormLabel>{t('accountForm.quotaLabel')}</FormLabel>}
            {resourcesFields.map(({ id }, index) => (
              <div key={id} className="flex flex-row gap-2">
                <FormField
                  control={form.control}
                  name={`resources.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="w-fit">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('accountForm.resourcePlaceholder')}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`resources.${index}.guaranteed`}
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t('accountForm.guaranteedPlaceholder')}
                          className="font-mono"
                          {...form.register(`resources.${index}.guaranteed`, {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`resources.${index}.deserved`}
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="string"
                          placeholder={t('accountForm.deservedPlaceholder')}
                          className="font-mono"
                          {...form.register(`resources.${index}.deserved`, {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`resources.${index}.capability`}
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="string"
                          placeholder={t('accountForm.capabilityPlaceholder')}
                          className="font-mono"
                          {...form.register(`resources.${index}.capability`, {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Button
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() => resourcesRemove(index)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {resourcesFields.length > 0 && (
              <FormDescription>{t('accountForm.quotaDescription')}</FormDescription>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                resourcesAppend({
                  name: '',
                })
              }
            >
              <CirclePlusIcon className="size-4" />
              {t('accountForm.addQuotaButton')}
            </Button>
          </div>
        </SandwichLayout>
      </form>
    </Form>
  )
}
