import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Reprots = React.lazy(() => import('./views/reports/index'))
const DayReport = React.lazy(() => import('./views/pages/dayreport/createreport'))
const ArchiveReport = React.lazy(() => import('./views/pages/dayreport/archivereport'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/reports', name: 'Reports', element: Reprots },

  { path: '/createReport', name: 'Create Report', element: DayReport },
  { path: '/archiveReport', name: 'Archive Report', element: ArchiveReport },
]

export default routes
