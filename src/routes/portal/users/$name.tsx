import { createFileRoute } from '@tanstack/react-router'

import { detailLinkOptions, detailValidateSearch } from '@/components/layout/detail-page'
import UserDetail from '@/components/layout/user-detail'

export const Route = createFileRoute('/portal/users/$name')({
  validateSearch: detailValidateSearch,
  component: RouteComponent,
  loader: ({ params }) => {
    const { name } = params
    return {
      crumb: name,
    }
  },
})

function RouteComponent() {
  const userName = Route.useParams().name
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <UserDetail
      name={userName}
      currentTab={tab}
      setCurrentTab={(tab) => navigate(detailLinkOptions(tab))}
    />
  )
}
