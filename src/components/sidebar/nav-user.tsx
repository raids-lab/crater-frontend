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
// ignore-i18n-script
import { Link, useNavigate } from '@tanstack/react-router'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  BadgeCheck,
  BookOpenIcon,
  ChevronsUpDown,
  Globe,
  LogOut,
  MessageSquareMoreIcon,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { Role } from '@/services/api/auth'

import useIsAdmin from '@/hooks/use-admin'
import { useAuth } from '@/hooks/use-auth'

import { getUserPseudonym } from '@/utils/pseudonym'
import { atomUserContext, atomUserInfo, globalHideUsername, globalLastView } from '@/utils/store'
import { configUrlWebsiteBaseAtom } from '@/utils/store/config'
import { useTheme } from '@/utils/theme'

import { UserAvatar } from '../layout/user-detail/user-avatar'

export function NavUser() {
  const website = useAtomValue(configUrlWebsiteBaseAtom)
  const { isMobile } = useSidebar()
  const user = useAtomValue(atomUserInfo)
  const context = useAtomValue(atomUserContext)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const setLastView = useSetAtom(globalLastView)
  const isAdminView = useIsAdmin()
  const hideUsername = useAtomValue(globalHideUsername)
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()

  const displayName = hideUsername
    ? getUserPseudonym(user?.name || '')
    : user?.nickname || user?.name || ''

  const changeLanguage = (lng: 'zh' | 'en' | 'ja' | 'ko') => {
    i18n.changeLanguage(lng)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={user} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar user={user} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {context?.rolePlatform === Role.Admin && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      if (isAdminView) {
                        setLastView('portal')
                        navigate({ to: '/portal' })
                        toast.success(t('navUser.switchToUserView'))
                      } else {
                        setLastView('admin')
                        navigate({ to: '/admin' })
                        toast.success(t('navUser.switchToAdminView'))
                      }
                    }}
                  >
                    <Sparkles />
                    {t('navUser.switchTo') +
                      (isAdminView ? t('navUser.normalUser') : t('navUser.admin'))}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/portal/settings/user">
                  <BadgeCheck />
                  {t('navUser.personalPage')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(website)}>
                <BookOpenIcon />
                {t('navUser.platformDocs')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open('https://github.com/raids-lab/crater/issues')}
              >
                <MessageSquareMoreIcon />
                {t('navUser.feedback')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'light' ? <Moon /> : <Sun />}
                {theme === 'light' ? t('navUser.darkMode') : t('navUser.lightMode')}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Globe className="text-muted-foreground mr-2 h-4 w-4" />
                  {t('navUser.language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={i18n.language}>
                    <DropdownMenuRadioItem value="zh" onClick={() => changeLanguage('zh')}>
                      {t('navUser.chinese')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en" onClick={() => changeLanguage('en')}>
                      {t('navUser.english')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ja" onClick={() => changeLanguage('ja')}>
                      {t('navUser.japanese')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ko" onClick={() => changeLanguage('ko')}>
                      {t('navUser.korean')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="focus:bg-destructive focus:text-destructive-foreground"
              onClick={() => {
                logout()
                navigate({ to: '/auth', search: { redirect: '/', token: '' } })
              }}
            >
              <LogOut className="dark:text-destructive-foreground" />
              {t('navUser.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
