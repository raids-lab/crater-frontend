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
import { DialogTrigger } from '@radix-ui/react-dialog'
import { ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Tree, TreeDataItem } from '@/components/file/lazy-file-tree'

import { cn } from '@/lib/utils'

export const FileSelectDialog = ({
  value,
  handleSubmit,
  disabled,
  allowSelectFile = true,
  isrw = false,
  title,
}: {
  value?: string
  handleSubmit: (path: TreeDataItem) => void
  disabled?: boolean
  allowSelectFile?: boolean
  isrw?: boolean
  title?: string
}) => {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [content, setContent] = useState<TreeDataItem | undefined>()

  const handleSelect = () => {
    if (content) {
      handleSubmit(content)
      toast.info(t('fileSelectDialog.selectedFile', { id: content.id }))
      setIsDialogOpen(false)
    } else {
      toast.warning(t('fileSelectDialog.selectFileOrFolder'))
    }
  }

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="file-select"
            className={cn(
              'focus:outline-primary w-full justify-between pr-4 pl-3 font-normal text-ellipsis whitespace-nowrap',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            {!isDialogOpen && value
              ? value === 'user'
                ? t('fileSelectDialog.userSpace')
                : value === 'account'
                  ? t('fileSelectDialog.accountSpace')
                  : value === 'public'
                    ? t('fileSelectDialog.publicSpace')
                    : value
              : t('fileSelectDialog.selectFile')}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title || t('fileSelectDialog.title')}</DialogTitle>
            <DialogDescription>{t('fileSelectDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="border-input relative flex h-80 flex-col gap-2 rounded-md border shadow-xs">
              <Tree
                className="h-full w-full shrink-0"
                isrw={isrw}
                onSelectChange={(item) => {
                  setContent(item)
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end sm:space-x-0">
            <Button
              type="button"
              className="w-full"
              onClick={handleSelect}
              disabled={!content || (!allowSelectFile && !content.isdir)}
            >
              {t('fileSelectDialog.confirmSelection', { name: content?.name })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
