import { Outlet, createFileRoute } from '@tanstack/react-router'
import { t } from 'i18next'

export const Route = createFileRoute('/admin/approvalorder')({
  component: RouteComponent,
  loader: () => {
    return {
      crumb: t('navigation.approvalOrder'),
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
