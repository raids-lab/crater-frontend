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
import { CalendarIcon, ChevronsUpDown, CopyIcon, Trash2Icon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import {
  CronJobRecord,
  apiAdminCronJobNameList,
  apiAdminCronJobRecordDelete,
  apiAdminCronJobRecordList,
  apiAdminCronJobRecordTimeRange,
} from '@/services/api/vcjob'

import CronJobRecordStatus from './cronjob-record-status'

export default function CronJobRecordsTable() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<CronJobRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterNames, setFilterNames] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [availableJobNames, setAvailableJobNames] = useState<string[]>([])
  const [minDate, setMinDate] = useState<Date | undefined>()
  const [maxDate, setMaxDate] = useState<Date | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [daysToDelete, setDaysToDelete] = useState<number>(1)

  useEffect(() => {
    const loadJobNames = async () => {
      try {
        const res = await apiAdminCronJobNameList()
        if (res.code === 0 && res.data) {
          setAvailableJobNames(res.data)
        }
      } catch (error) {
        toast.error(t('cronJob.record.table.loadJobNamesError') + error)
      }
    }
    loadJobNames()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadTimeRange = async () => {
      try {
        const res = await apiAdminCronJobRecordTimeRange()
        if (res.code === 0 && res.data) {
          if (res.data.startTime) {
            setMinDate(new Date(res.data.startTime))
          }
          if (res.data.endTime) {
            setMaxDate(new Date(res.data.endTime))
          }
        }
      } catch (error) {
        toast.error(t('cronJob.record.table.loadTimeRangeError') + error)
      }
    }
    loadTimeRange()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiAdminCronJobRecordList({
        name: filterNames.length > 0 ? filterNames : undefined,
        startTime: dateRange?.from?.toISOString(),
        endTime: dateRange?.to?.toISOString(),
        status: filterStatus === 'all' ? undefined : filterStatus,
        pageNum,
        pageSize,
      })
      if (res.code === 0 && res.data) {
        setRecords(res.data.records || [])
        setTotal(res.data.total || 0)
      } else {
        toast.error(t('cronPolicy.recordsLoadError') + res.msg)
      }
    } catch (error) {
      toast.error(t('cronPolicy.recordsLoadError') + error)
    } finally {
      setLoading(false)
    }
  }, [filterNames, dateRange, filterStatus, pageNum, pageSize, t])

  useEffect(() => {
    loadRecords()
    const interval = setInterval(loadRecords, 30000)
    return () => clearInterval(interval)
  }, [loadRecords])

  const toggleJobName = (name: string) => {
    setFilterNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
    setPageNum(1)
  }

  const selectAllJobNames = () => {
    setFilterNames([...availableJobNames])
    setPageNum(1)
  }

  const clearAllJobNames = () => {
    setFilterNames([])
    setPageNum(1)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('cronJob.record.table.copySuccess'))
    } catch (error) {
      toast.error(t('cronJob.record.table.copyError') + error)
    }
  }

  const formatJobData = (jobData: unknown): string => {
    return JSON.stringify(jobData, undefined, 2)
  }

  const truncateText = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const isJobDataEmpty = (jobData?: { reminded?: string[]; deleted?: string[] }): boolean => {
    if (!jobData) return true
    const hasReminded = jobData.reminded && jobData.reminded.length > 0
    const hasDeleted = jobData.deleted && jobData.deleted.length > 0
    return !hasReminded && !hasDeleted
  }

  const handleDeleteRecords = async () => {
    try {
      // 计算UTC时间：当前UTC时间减去指定天数
      const endTime = new Date()
      endTime.setUTCDate(endTime.getUTCDate() - daysToDelete)

      const res = await apiAdminCronJobRecordDelete({
        endTime: endTime.toISOString(),
      })

      if (res.code === 0 && res.data) {
        const deletedCount = parseInt(res.data.deleted, 10) || 0
        toast.success(t('cronJob.record.table.deleteSuccess', { count: deletedCount }))
        setDeleteDialogOpen(false)
        loadRecords()
      } else {
        toast.error(t('cronJob.record.table.deleteError') + res.msg)
      }
    } catch (error) {
      toast.error(t('cronJob.record.table.deleteError') + error)
    }
  }

  return (
    <Card className="mt-1">
      <CardHeader>
        <CardTitle>{t('cronJob.record.table.recordsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">{t('cronJob.record.table.dateRange')}:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange?.to ? (
                        <>
                          {dateRange.from.toLocaleDateString()} -{' '}
                          {dateRange.to.toLocaleDateString()}
                        </>
                      ) : (
                        dateRange.from.toLocaleDateString()
                      )
                    ) : (
                      <span>{t('cronJob.record.table.selectDateRange')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    fromDate={minDate}
                    toDate={maxDate}
                    disabled={(date) => {
                      if (minDate && date < minDate) return true
                      if (maxDate && date > maxDate) return true
                      return false
                    }}
                  />
                </PopoverContent>
              </Popover>
              {(dateRange?.from || dateRange?.to) && (
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                  {t('cronJob.record.table.clearDate')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">{t('cronJob.record.table.statusFilter')}:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('cronJob.record.table.allStatus')}</SelectItem>
                  <SelectItem value="success">{t('cronJob.record.table.success')}</SelectItem>
                  <SelectItem value="failed">{t('cronJob.record.table.failed')}</SelectItem>
                  <SelectItem value="unknown">{t('cronJob.record.table.unknown')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">{t('cronJob.record.table.jobName')}:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-between">
                  {filterNames.length === 0
                    ? t('cronJob.record.table.selectJobs')
                    : filterNames.length === availableJobNames.length
                      ? t('cronJob.record.table.allJobs')
                      : `${t('cronJob.record.table.selectedCount', { count: filterNames.length })}`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('cronJob.record.table.searchJobs')} />
                  <CommandList>
                    <CommandEmpty>{t('cronJob.record.table.noJobsFound')}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          if (filterNames.length === availableJobNames.length) {
                            clearAllJobNames()
                          } else {
                            selectAllJobNames()
                          }
                        }}
                      >
                        <Checkbox
                          checked={
                            filterNames.length === availableJobNames.length &&
                            availableJobNames.length > 0
                          }
                          className="mr-2"
                        />
                        <span className="font-medium">{t('cronJob.record.table.selectAll')}</span>
                      </CommandItem>
                    </CommandGroup>
                    {availableJobNames.length > 0 && <CommandSeparator />}
                    <CommandGroup>
                      {availableJobNames.map((name) => (
                        <CommandItem key={name} onSelect={() => toggleJobName(name)}>
                          <Checkbox checked={filterNames.includes(name)} className="mr-2" />
                          <span className="font-mono text-sm">{name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {filterNames.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={clearAllJobNames}
                      >
                        {t('cronJob.record.table.clearSelection')}
                      </Button>
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loading && records.length === 0 ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('cronJob.record.table.jobName')}</TableHead>
                    <TableHead>{t('cronJob.record.table.executeTime')}</TableHead>
                    <TableHead>{t('cronJob.record.table.status')}</TableHead>
                    <TableHead>{t('cronJob.record.table.message')}</TableHead>
                    <TableHead>{t('cronJob.record.table.affected')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center">
                        {t('cronJob.record.table.noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">{record.name}</TableCell>
                        <TableCell>{formatDate(record.executeTime)}</TableCell>
                        <TableCell>
                          <CronJobRecordStatus status={record.status} />
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={record.message}>
                          {record.message || '-'}
                        </TableCell>
                        <TableCell>
                          {!isJobDataEmpty(record.jobData) ? (
                            <TooltipProvider>
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help text-sm">
                                      {record.jobData!.reminded &&
                                        record.jobData!.reminded.length > 0 && (
                                          <div>
                                            {t('cronJob.record.table.reminded')}:{' '}
                                            {record.jobData!.reminded.length}
                                          </div>
                                        )}
                                      {record.jobData!.deleted &&
                                        record.jobData!.deleted.length > 0 && (
                                          <div>
                                            {t('cronJob.record.table.deleted')}:{' '}
                                            {record.jobData!.deleted.length}
                                          </div>
                                        )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="left"
                                    className="max-h-96 max-w-md overflow-auto"
                                  >
                                    <pre className="font-mono text-xs whitespace-pre-wrap">
                                      {truncateText(formatJobData(record.jobData))}
                                    </pre>
                                  </TooltipContent>
                                </Tooltip>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(formatJobData(record.jobData))}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </TooltipProvider>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {t('cronJob.record.table.pageSize')}:
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPageNum(1)
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-sm">
                    {t('cronJob.record.table.total', { total: total })}
                  </span>
                </div>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        {t('cronJob.record.table.deleteRecords')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setDaysToDelete(1)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        {t('cronJob.record.table.delete1DayBefore')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDaysToDelete(7)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        {t('cronJob.record.table.delete7DaysBefore')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDaysToDelete(15)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        {t('cronJob.record.table.delete15DaysBefore')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('cronJob.record.table.deleteConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('cronJob.record.table.deleteConfirmMessage', { days: daysToDelete })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cronJob.record.table.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRecords}>
                        {t('cronJob.record.table.confirmDelete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNum <= 1}
                  onClick={() => setPageNum(pageNum - 1)}
                >
                  {t('cronJob.record.table.prevPage')}
                </Button>
                <span className="text-sm">
                  {t('cronJob.record.table.pageInfo', {
                    current: pageNum,
                    total: Math.ceil(total / pageSize),
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNum >= total}
                  onClick={() => setPageNum(pageNum + 1)}
                >
                  {t('cronJob.record.table.nextPage')}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
