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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2Icon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { AddNodeMarkDialog } from '@/components/node/add-node-mark-dialog'
import { DeleteConfirmDialog } from '@/components/node/delete-confirm-dialog'
import { DataTable } from '@/components/query-table'
import { DataTableColumnHeader } from '@/components/query-table/column-header'

import {
  type IClusterNodeAnnotation,
  type IClusterNodeLabel,
  type IClusterNodeTaint,
  apiAddNodeAnnotation,
  apiAddNodeLabel,
  apiAddNodeTaint,
  apiDeleteNodeAnnotation,
  apiDeleteNodeLabel,
  apiDeleteNodeTaint,
  apiGetNodeMark,
} from '@/services/api/cluster'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

export enum DialogType {
  LABEL = 'label',
  ANNOTATION = 'annotation',
  TAINT = 'taint',
}

interface NodeMarkListProps {
  nodeName: string
}

// 截断显示组件，带复制功能
function TruncatedCell({ value, maxLength = 30 }: { value: string; maxLength?: number }) {
  const { handleCopy } = useCopyToClipboard({ text: value })
  const shouldTruncate = value.length > maxLength
  const displayValue = shouldTruncate ? `${value.slice(0, maxLength)}...` : value

  if (shouldTruncate) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="hover:text-primary cursor-pointer truncate font-mono text-sm"
              onClick={handleCopy}
            >
              {displayValue}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            <p className="text-xs break-all">{value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <span className="hover:text-primary cursor-pointer font-mono text-sm" onClick={handleCopy}>
      {value}
    </span>
  )
}

export function NodeMarkList({ nodeName }: NodeMarkListProps) {
  const queryClient = useQueryClient()

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: DialogType
    item: IClusterNodeLabel | IClusterNodeAnnotation | IClusterNodeTaint | null
  }>({
    open: false,
    type: DialogType.LABEL,
    item: null,
  })

  // 创建三个独立的查询用于DataTable
  const labelsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'labels'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.labels || []
    },
    enabled: !!nodeName,
  })

  const annotationsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'annotations'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.annotations || []
    },
    enabled: !!nodeName,
  })

  const taintsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'taints'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.taints || []
    },
    enabled: !!nodeName,
  })

  // Label删除mutation
  const { mutate: deleteLabelMutate } = useMutation({
    mutationFn: (label: IClusterNodeLabel) => apiDeleteNodeLabel(nodeName, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Label删除成功')
    },
  })

  // Label添加mutation
  const { mutate: addLabelMutate } = useMutation({
    mutationFn: (label: IClusterNodeLabel) => apiAddNodeLabel(nodeName, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Label添加成功')
    },
  })

  // Annotation删除mutation
  const { mutate: deleteAnnotationMutate } = useMutation({
    mutationFn: (annotation: IClusterNodeAnnotation) =>
      apiDeleteNodeAnnotation(nodeName, annotation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Annotation删除成功')
    },
  })

  // Annotation添加mutation
  const { mutate: addAnnotationMutate } = useMutation({
    mutationFn: (annotation: IClusterNodeAnnotation) => apiAddNodeAnnotation(nodeName, annotation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Annotation添加成功')
    },
  })

  // Taint删除mutation
  const { mutate: deleteTaintMutate } = useMutation({
    mutationFn: (taint: IClusterNodeTaint) => apiDeleteNodeTaint(nodeName, taint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Taint删除成功')
    },
  })

  // Taint添加mutation
  const { mutate: addTaintMutate } = useMutation({
    mutationFn: (taint: IClusterNodeTaint) => apiAddNodeTaint(nodeName, taint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Taint添加成功')
    },
  })

  const handleDeleteLabel = useCallback(
    (label: IClusterNodeLabel) => {
      setDeleteDialog({
        open: true,
        type: DialogType.LABEL,
        item: label,
      })
    },
    [setDeleteDialog]
  )

  const handleAddLabel = useCallback(
    (key: string, value: string) => {
      addLabelMutate({ key, value })
    },
    [addLabelMutate]
  )

  const handleDeleteAnnotation = useCallback(
    (annotation: IClusterNodeAnnotation) => {
      setDeleteDialog({
        open: true,
        type: DialogType.ANNOTATION,
        item: annotation,
      })
    },
    [setDeleteDialog]
  )

  const handleAddAnnotation = useCallback(
    (key: string, value: string) => {
      addAnnotationMutate({ key, value })
    },
    [addAnnotationMutate]
  )

  const handleDeleteTaint = useCallback(
    (taint: IClusterNodeTaint) => {
      setDeleteDialog({
        open: true,
        type: DialogType.TAINT,
        item: taint,
      })
    },
    [setDeleteDialog]
  )

  const handleAddTaint = useCallback(
    (key: string, value: string, effect?: string) => {
      if (effect) {
        addTaintMutate({ key, value, effect })
      }
    },
    [addTaintMutate]
  )

  // 处理删除确认
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteDialog.item) return

    switch (deleteDialog.type) {
      case 'label':
        deleteLabelMutate(deleteDialog.item as IClusterNodeLabel)
        break
      case 'annotation':
        deleteAnnotationMutate(deleteDialog.item as IClusterNodeAnnotation)
        break
      case 'taint':
        deleteTaintMutate(deleteDialog.item as IClusterNodeTaint)
        break
    }
  }, [deleteDialog, deleteLabelMutate, deleteAnnotationMutate, deleteTaintMutate])

  // Labels 列定义
  const labelColumns: ColumnDef<IClusterNodeLabel>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Label名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Label值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteLabel(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteLabel]
  )

  // Annotations 列定义
  const annotationColumns: ColumnDef<IClusterNodeAnnotation>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Annotation名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Annotation值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAnnotation(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteAnnotation]
  )

  // Taints 列定义
  const taintColumns: ColumnDef<IClusterNodeTaint>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={40} />,
      },
      {
        accessorKey: 'effect',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint效果" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={20} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTaint(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteTaint]
  )

  return (
    <div className="space-y-6">
      {/* Labels 表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Labels</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddNodeMarkDialog type={DialogType.LABEL} onAdd={handleAddLabel} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable storageKey="node-labels" query={labelsQuery} columns={labelColumns} />
        </CardContent>
      </Card>

      {/* Annotations 表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Annotations</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddNodeMarkDialog type={DialogType.ANNOTATION} onAdd={handleAddAnnotation} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            storageKey="node-annotations"
            query={annotationsQuery}
            columns={annotationColumns}
          />
        </CardContent>
      </Card>

      {/* Taints 表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Taints</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddNodeMarkDialog type={DialogType.TAINT} onAdd={handleAddTaint} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable storageKey="node-taints" query={taintsQuery} columns={taintColumns} />
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title={`删除${deleteDialog.type === DialogType.LABEL ? 'Label' : deleteDialog.type === DialogType.ANNOTATION ? 'Annotation' : 'Taint'}`}
        itemInfo={{
          key: deleteDialog.item?.key || '',
          value: deleteDialog.item?.value || '',
          effect:
            'effect' in (deleteDialog.item || {})
              ? (deleteDialog.item as IClusterNodeTaint)?.effect
              : undefined,
        }}
        type={DialogType.TAINT}
      />
    </div>
  )
}

// 单独的Labels组件
export function NodeLabels({ nodeName }: NodeMarkListProps) {
  const queryClient = useQueryClient()

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    item: IClusterNodeLabel | null
  }>({
    open: false,
    item: null,
  })

  const labelsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'labels'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.labels || []
    },
    enabled: !!nodeName,
  })

  const { mutate: deleteLabelMutate } = useMutation({
    mutationFn: (label: IClusterNodeLabel) => apiDeleteNodeLabel(nodeName, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Label删除成功')
    },
  })

  const { mutate: addLabelMutate } = useMutation({
    mutationFn: (label: IClusterNodeLabel) => apiAddNodeLabel(nodeName, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Label添加成功')
    },
  })

  const handleDeleteLabel = useCallback(
    (label: IClusterNodeLabel) => {
      setDeleteDialog({
        open: true,
        item: label,
      })
    },
    [setDeleteDialog]
  )

  const handleAddLabel = useCallback(
    (key: string, value: string) => {
      addLabelMutate({ key, value })
    },
    [addLabelMutate]
  )

  // 处理删除确认
  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.item) {
      deleteLabelMutate(deleteDialog.item)
    }
  }, [deleteDialog.item, deleteLabelMutate])

  const labelColumns: ColumnDef<IClusterNodeLabel>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Label名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={40} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Label值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteLabel(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteLabel]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Labels</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="size-4" />
              添加 Label 标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddNodeMarkDialog type={DialogType.LABEL} onAdd={handleAddLabel} />
          </DialogContent>
        </Dialog>
      </div>
      <DataTable storageKey="node-labels" query={labelsQuery} columns={labelColumns} />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title="删除Label"
        itemInfo={{
          key: deleteDialog.item?.key || '',
          value: deleteDialog.item?.value || '',
        }}
        type={DialogType.LABEL}
      />
    </div>
  )
}

// 单独的Annotations组件
export function NodeAnnotations({ nodeName }: NodeMarkListProps) {
  const queryClient = useQueryClient()

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    item: IClusterNodeAnnotation | null
  }>({
    open: false,
    item: null,
  })

  const annotationsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'annotations'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.annotations || []
    },
    enabled: !!nodeName,
  })

  const { mutate: deleteAnnotationMutate } = useMutation({
    mutationFn: (annotation: IClusterNodeAnnotation) =>
      apiDeleteNodeAnnotation(nodeName, annotation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Annotation删除成功')
    },
  })

  const { mutate: addAnnotationMutate } = useMutation({
    mutationFn: (annotation: IClusterNodeAnnotation) => apiAddNodeAnnotation(nodeName, annotation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Annotation添加成功')
    },
  })

  const handleDeleteAnnotation = useCallback(
    (annotation: IClusterNodeAnnotation) => {
      setDeleteDialog({
        open: true,
        item: annotation,
      })
    },
    [setDeleteDialog]
  )

  const handleAddAnnotation = useCallback(
    (key: string, value: string) => {
      addAnnotationMutate({ key, value })
    },
    [addAnnotationMutate]
  )

  // 处理删除确认
  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.item) {
      deleteAnnotationMutate(deleteDialog.item)
    }
  }, [deleteDialog.item, deleteAnnotationMutate])

  const annotationColumns: ColumnDef<IClusterNodeAnnotation>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Annotation名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={30} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Annotation值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAnnotation(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteAnnotation]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Annotations</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="size-4" />
              添加 Annotation 标注
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddNodeMarkDialog type={DialogType.ANNOTATION} onAdd={handleAddAnnotation} />
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        storageKey="node-annotations"
        query={annotationsQuery}
        columns={annotationColumns}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title="删除Annotation"
        itemInfo={{
          key: deleteDialog.item?.key || '',
          value: deleteDialog.item?.value || '',
        }}
        type={DialogType.ANNOTATION}
      />
    </div>
  )
}

// 单独的Taints组件
export function NodeTaints({ nodeName }: NodeMarkListProps) {
  const queryClient = useQueryClient()

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    item: IClusterNodeTaint | null
  }>({
    open: false,
    item: null,
  })

  const taintsQuery = useQuery({
    queryKey: ['nodes', nodeName, 'mark', 'taints'],
    queryFn: async () => {
      const res = await apiGetNodeMark(nodeName)
      return res.data?.taints || []
    },
    enabled: !!nodeName,
  })

  const { mutate: deleteTaintMutate } = useMutation({
    mutationFn: (taint: IClusterNodeTaint) => apiDeleteNodeTaint(nodeName, taint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Taint删除成功')
    },
  })

  const { mutate: addTaintMutate } = useMutation({
    mutationFn: (taint: IClusterNodeTaint) => apiAddNodeTaint(nodeName, taint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeName, 'mark'] })
      toast.success('Taint添加成功')
    },
  })

  const handleDeleteTaint = useCallback(
    (taint: IClusterNodeTaint) => {
      setDeleteDialog({
        open: true,
        item: taint,
      })
    },
    [setDeleteDialog]
  )

  const handleAddTaint = useCallback(
    (key: string, value: string, effect?: string) => {
      if (effect) {
        addTaintMutate({ key, value, effect })
      }
    },
    [addTaintMutate]
  )

  // 处理删除确认
  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.item) {
      deleteTaintMutate(deleteDialog.item)
    }
  }, [deleteDialog.item, deleteTaintMutate])

  const taintColumns: ColumnDef<IClusterNodeTaint>[] = useMemo(
    () => [
      {
        accessorKey: 'key',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint名" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={30} />,
      },
      {
        accessorKey: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint值" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={50} />,
      },
      {
        accessorKey: 'effect',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Taint效果" />,
        cell: ({ getValue }) => <TruncatedCell value={getValue<string>()} maxLength={20} />,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTaint(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2Icon className="text-destructive h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleDeleteTaint]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Taints</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="size-4" />
              添加 Taint 污点
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddNodeMarkDialog type={DialogType.TAINT} onAdd={handleAddTaint} />
          </DialogContent>
        </Dialog>
      </div>
      <DataTable storageKey="node-taints" query={taintsQuery} columns={taintColumns} />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title="删除Taint"
        itemInfo={{
          key: deleteDialog.item?.key || '',
          value: deleteDialog.item?.value || '',
          effect: deleteDialog.item?.effect,
        }}
        type={DialogType.TAINT}
      />
    </div>
  )
}

export default NodeMarkList
