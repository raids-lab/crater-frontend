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
// i18n-processed-v1.1.0
// Modified code
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useAtomValue } from 'jotai'
import {
  CheckIcon,
  ClockIcon,
  Database,
  Hourglass,
  InfoIcon,
  ListChecks,
  MoreHorizontal,
  XIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  ApprovalOrderStatus,
  ApprovalOrderStatusBadge,
  ApprovalOrderType,
  ApprovalOrderTypeBadge,
  approvalOrderStatuses,
  approvalOrderTypes,
} from '@/components/badge/ApprovalorderBadge'
import { TimeDistance } from '@/components/custom/TimeDistance'
import UserLabel from '@/components/label/user-label'
import { SectionCards } from '@/components/metrics/section-cards'
import { DataTable } from '@/components/query-table'
import { DataTableColumnHeader } from '@/components/query-table/column-header'
import { DataTableToolbarConfig } from '@/components/query-table/toolbar'

import {
  type ApprovalOrder,
  listApprovalOrders,
  updateApprovalOrder,
} from '@/services/api/approvalorder'
import { type IJobInfo, apiAdminGetJobList } from '@/services/api/vcjob'

import { atomUserInfo } from '@/utils/store'

import { DurationDialog } from '../jobs/-components/DurationDialog'

export const Route = createFileRoute('/admin/approvalorder/')({
  component: RouteComponent,
})
export const getHeader = (key: string): string => {
  switch (key) {
    case 'name':
      return '名称'
    case 'type':
      return '类型'
    case 'status':
      return '状态'
    case 'createdAt':
      return '创建于'
    default:
      return key
  }
}

function RouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAtomValue(atomUserInfo)
  const [selectedOrder, setSelectedOrder] = useState<ApprovalOrder | null>(null)
  const [selectedJob, setSelectedJob] = useState<IJobInfo | null>(null)
  const [isDelayDialogOpen, setIsDelayDialogOpen] = useState(false)

  const query = useQuery({
    queryKey: ['admin', 'approvalorders'],
    queryFn: () => listApprovalOrders(),
    select: (res) =>
      [...(res.data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
  })

  // 获取作业列表用于查找对应作业
  const { data: jobList } = useQuery({
    queryKey: ['admin', 'tasklist', 'job', -1],
    queryFn: () => apiAdminGetJobList(-1),
    select: (res) => res.data,
  })

  const refetchOrders = () => {
    queryClient.invalidateQueries({
      queryKey: ['admin', 'approvalorders'],
    })
  }

  // 批准操作（仅用于无需延时的场景）
  const { mutate: approveOrder, isPending: isApproving } = useMutation({
    mutationFn: async (order: ApprovalOrder) => {
      await updateApprovalOrder(order.id, {
        name: order.name,
        type: order.type,
        status: 'Approved',
        approvalorderTypeID: Number(order.content.approvalorderTypeID) || 0,
        approvalorderReason: String(order.content.approvalorderReason || ''),
        approvalorderExtensionHours: Number(order.content.approvalorderExtensionHours) || 0,
        reviewerID: user?.id || 0,
      })
      return order
    },
    onSuccess: () => {
      toast.success(t('ApprovalOrderTable.toast.approveSuccess'))
      refetchOrders()
    },
    onError: () => {
      toast.error(t('ApprovalOrderTable.toast.approveError'))
    },
  })

  // 拒绝操作 mutation
  const { mutate: rejectOrder, isPending: isRejecting } = useMutation({
    mutationFn: async (order: ApprovalOrder) => {
      return updateApprovalOrder(order.id, {
        name: order.name,
        type: order.type,
        status: 'Rejected',
        approvalorderTypeID: Number(order.content.approvalorderTypeID) || 0,
        approvalorderReason: String(order.content.approvalorderReason || ''),
        approvalorderExtensionHours: Number(order.content.approvalorderExtensionHours) || 0,
        reviewerID: user?.id || 0,
      })
    },
    onSuccess: () => {
      toast.success(t('ApprovalOrderTable.toast.rejectSuccess'))
      refetchOrders()
    },
    onError: () => {
      toast.error(t('ApprovalOrderTable.toast.rejectError'))
    },
  })

  // 选中工单的延时小时（只用 content.approvalorderExtensionHours，空按 0 处理）
  const selectedExtHours = useMemo(() => {
    const n = Number(selectedOrder?.content?.approvalorderExtensionHours)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  }, [selectedOrder])

  // 仅弹出对话框，不直接更新工单
  const handleApproveWithDelay = (order: ApprovalOrder) => {
    const job = jobList?.find((j) => j.jobName === order.name)
    if (job) {
      setSelectedOrder(order)
      setSelectedJob(job)
      setIsDelayDialogOpen(true)
    } else {
      toast.error(t('ApprovalOrderTable.toast.jobNotFound'))
    }
  }

  // DurationDialog 成功后再更新工单状态为 Approved
  const handleDelaySuccess = async () => {
    if (selectedOrder) {
      await updateApprovalOrder(selectedOrder.id, {
        name: selectedOrder.name,
        type: selectedOrder.type,
        status: 'Approved',
        approvalorderTypeID: Number(selectedOrder.content.approvalorderTypeID) || 0,
        approvalorderReason: String(selectedOrder.content.approvalorderReason || ''),
        approvalorderExtensionHours: Number(selectedOrder.content.approvalorderExtensionHours) || 0,
        reviewerID: user?.id || 0,
      })
      toast.success(t('ApprovalOrderTable.toast.approveSuccess'))
      refetchOrders()
    }
    setIsDelayDialogOpen(false)
    setSelectedOrder(null)
    setSelectedJob(null)
  }
  const toolbarConfig: DataTableToolbarConfig = {
    globalSearch: {
      enabled: true,
    },
    filterOptions: [
      {
        key: 'type',
        title: t('ApprovalOrderTable.column.type'),
        option: approvalOrderTypes,
      },
      {
        key: 'status',
        title: t('ApprovalOrderTable.column.status'),
        option: approvalOrderStatuses,
      },
    ],
    getHeader: getHeader,
  }
  const columns: ColumnDef<ApprovalOrder>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ApprovalOrderTable.column.name')} />
      ),
      cell: ({ row }) => {
        const extHours = row.original.content.approvalorderExtensionHours || 0
        return (
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              // 原来: "max-w-36 truncate text-left underline-offset-4 hover:underline"
              className="text-left break-all whitespace-normal underline-offset-4 hover:underline"
              title={`查看工单 ${row.getValue('name')} 详情`}
              onClick={() => {
                const orderType = row.original.type
                if (orderType === 'job') {
                  navigate({ to: '/admin/jobs/$name', params: { name: row.original.name } })
                } else if (orderType === 'dataset') {
                  navigate({
                    to: `${row.original.id}`,
                    search: (prev) => ({ ...prev, type: 'dataset' }),
                  })
                }
              }}
            >
              {row.getValue('name')}
            </button>
            {row.original.type === 'job' && Number(extHours) > 0 && (
              <div
                title={`延时 ${extHours} 小时`}
                className="bg-warning/10 text-warning inline-flex items-center gap-1 rounded px-2 py-1 text-xs"
              >
                <ClockIcon className="h-3 w-3" />
                {extHours}h
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'nickname',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ApprovalOrderTable.column.creator')} />
      ),
      cell: ({ row }) => <UserLabel info={row.original.creator} />,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ApprovalOrderTable.column.type')} />
      ),
      cell: ({ row }) => {
        return <ApprovalOrderTypeBadge type={row.getValue<ApprovalOrderType>('type')} />
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ApprovalOrderTable.column.status')} />
      ),
      cell: ({ row }) => {
        return <ApprovalOrderStatusBadge status={row.getValue<ApprovalOrderStatus>('status')} />
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('ApprovalOrderTable.column.createdAt')} />
      ),
      cell: ({ row }) => <TimeDistance date={row.getValue('createdAt')} />,
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      header: t('ApprovalOrderTable.column.actions'),
      cell: ({ row }) => {
        const order = row.original
        const isPending = order.status === 'Pending'
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开操作菜单</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-xs">操作</DropdownMenuLabel>

              <DropdownMenuItem onClick={() => navigate({ to: `${order.id}` })}>
                <InfoIcon className="text-highlight-emerald" />
                查看详情
              </DropdownMenuItem>

              {isPending && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      if (order.type === 'job') {
                        // 一律先弹出延时对话框，成功后再把工单设为 Approved
                        handleApproveWithDelay(order)
                      } else {
                        // 非 job 直接批准
                        approveOrder(order)
                      }
                    }}
                    disabled={isApproving || isRejecting}
                  >
                    <CheckIcon className="text-highlight-green" />
                    {order.type === 'job' ? '批准并延时' : '批准'}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => rejectOrder(order)}
                    disabled={isApproving || isRejecting}
                  >
                    <XIcon className="text-destructive" />
                    拒绝
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // 统计卡片数据
  const totalPending = useMemo(
    () => (query.data ?? []).filter((o) => o.status === 'Pending').length,
    [query.data]
  )
  const pendingJobDelay = useMemo(
    () =>
      (query.data ?? []).filter(
        (o) =>
          o.status === 'Pending' &&
          o.type === 'job' &&
          Number(o.content?.approvalorderExtensionHours) > 0
      ).length,
    [query.data]
  )
  const pendingDataset = useMemo(
    () => (query.data ?? []).filter((o) => o.status === 'Pending' && o.type === 'dataset').length,
    [query.data]
  )

  return (
    <>
      <SectionCards
        items={[
          {
            title: '待审批工单',
            value: totalPending,
            className: 'text-highlight-blue',
            description: '所有状态为待审批的工单总数',
            icon: ListChecks,
          },
          {
            title: '作业延时待审批',
            value: pendingJobDelay,
            className: 'text-highlight-purple',
            description: '类型为作业且申请了延时的待审批工单数',
            icon: Hourglass,
          },
          {
            title: '数据迁移待审批',
            value: pendingDataset,
            className: 'text-highlight-emerald',
            description: '类型为数据集的数据迁移待审批工单数',
            icon: Database,
          },
        ]}
        className="lg:col-span-2"
      />
      <DataTable
        info={{
          title: t('ApprovalOrderTable.info.title'),
          description: t('ApprovalOrderTable.info.description'),
        }}
        toolbarConfig={toolbarConfig}
        storageKey="portal_approvalorder_management"
        query={query}
        columns={columns}
      />

      {/* 延时锁定对话框 */}
      {selectedJob && selectedOrder && (
        <DurationDialog
          key={`${selectedOrder.id}-${selectedExtHours}`} // 默认值变化时重建
          jobs={[selectedJob]}
          open={isDelayDialogOpen}
          setOpen={setIsDelayDialogOpen}
          onSuccess={handleDelaySuccess}
          setExtend={selectedJob.locked}
          defaultDays={Math.floor(selectedExtHours / 24)}
          defaultHours={selectedExtHours % 24}
        />
      )}
    </>
  )
}
