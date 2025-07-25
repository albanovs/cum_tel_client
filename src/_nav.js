import React from 'react'
import { MdDashboard } from "react-icons/md";
import { FaBook, FaUsers, FaTruck, FaTruckLoading } from "react-icons/fa";
import { BsBoxSeamFill } from "react-icons/bs";
import { FaSignsPost } from "react-icons/fa6";
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Статистика',
    to: '/dashboard',
    icon: <MdDashboard className="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Клиенты',
  },
  {
    component: CNavItem,
    name: 'База данных',
    to: '/reports',
    icon: <FaBook className="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Отчеты',
  },
  {
    component: CNavItem,
    name: 'Создать отчет',
    to: '/createReport',
    icon: <FaTruck className="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Архив',
    to: '/archiveReport',
    icon: <FaTruckLoading className="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Работа с данными',
  },
  {
    component: CNavGroup,
    name: 'Склад',
    to: '/base',
    icon: <BsBoxSeamFill className="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Склад 1',
        to: '/base/accordion',
      },
      {
        component: CNavItem,
        name: 'Склад 2',
        to: '/base/breadcrumbs',
      },
    ]
  },
  {
    component: CNavGroup,
    name: 'Отделы',
    to: '/buttons',
    icon: <FaSignsPost className="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Отдел 1',
        to: '/buttons/buttons',
      },
      {
        component: CNavItem,
        name: 'Отдел 2',
        to: '/buttons/button-groups',
      },
    ],
  },
]

export default _nav
