export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Dynamic Configuration API
 *
 * GET  — Fetch config by section (widgets|themes|sidebar)
 * POST — Perform actions: save_widget, delete_widget, reorder_widgets,
 *        save_theme, apply_theme, reset_theme,
 *        save_sidebar_item, delete_sidebar_item, reorder_sidebar
 */

// ── Default theme configs for reset ────────────────────────────────────────
const DEFAULT_THEMES: Record<string, {
  key: string
  name: string
  primaryColor: string
  secondaryColor: string | null
  accentColor: string
  backgroundColor: string
  sidebarStyle: string
  sidebarColor: string
  topbarStyle: string
  borderRadius: string
  fontFamily: string
  customCSS: string | null
  logo: string | null
  favicon: string | null
  loginBackground: string | null
}> = {
  admin_theme: {
    key: 'admin_theme',
    name: 'Admin Portal Default',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    accentColor: '#d97706',
    backgroundColor: '#ffffff',
    sidebarStyle: 'default',
    sidebarColor: '#ffffff',
    topbarStyle: 'default',
    borderRadius: '0.75rem',
    fontFamily: 'Inter',
    customCSS: null,
    logo: null,
    favicon: null,
    loginBackground: null,
  },
  cms_theme: {
    key: 'cms_theme',
    name: 'CMS Portal Default',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    accentColor: '#d97706',
    backgroundColor: '#ffffff',
    sidebarStyle: 'default',
    sidebarColor: '#f9fafb',
    topbarStyle: 'compact',
    borderRadius: '0.5rem',
    fontFamily: 'Inter',
    customCSS: null,
    logo: null,
    favicon: null,
    loginBackground: null,
  },
  student_theme: {
    key: 'student_theme',
    name: 'Student Portal Default',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    accentColor: '#d97706',
    backgroundColor: '#f8fafc',
    sidebarStyle: 'compact',
    sidebarColor: '#ffffff',
    topbarStyle: 'default',
    borderRadius: '0.75rem',
    fontFamily: 'Inter',
    customCSS: null,
    logo: null,
    favicon: null,
    loginBackground: null,
  },
}

// Default sidebar items for seeding
const DEFAULT_SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', targetPage: 'admin-dashboard', order: 0, isVisible: true },
  { key: 'teachers', label: 'Teachers', icon: 'Users', targetPage: 'admin-teachers', order: 1, isVisible: true },
  { key: 'students', label: 'Students', icon: 'GraduationCap', targetPage: 'admin-students', order: 2, isVisible: true },
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', targetPage: 'admin-analytics', order: 3, isVisible: true },
  { key: 'settings', label: 'Settings', icon: 'Settings', targetPage: 'admin-settings', order: 4, isVisible: true },
]

// Default widgets for seeding
const DEFAULT_WIDGETS = [
  { widgetKey: 'revenue_chart', title: 'Revenue Chart', type: 'chart', size: 'large', order: 0, isVisible: true, dataSource: '/api/admin/analytics', config: '{"chartType":"line","period":"30d"}' },
  { widgetKey: 'student_stats', title: 'Student Stats', type: 'stat', size: 'small', order: 1, isVisible: true, dataSource: '/api/admin/analytics', config: '{"metric":"totalStudents"}' },
  { widgetKey: 'recent_orders', title: 'Recent Orders', type: 'list', size: 'medium', order: 2, isVisible: true, dataSource: '/api/admin/orders', config: '{"limit":5}' },
  { widgetKey: 'active_teachers', title: 'Active Teachers', type: 'stat', size: 'small', order: 3, isVisible: true, dataSource: '/api/admin/teachers', config: '{"metric":"activeTeachers"}' },
]

export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section')

    if (!section || !['widgets', 'themes', 'sidebar'].includes(section)) {
      return NextResponse.json(
        { success: false, message: 'Invalid section. Use widgets, themes, or sidebar.' },
        { status: 400 }
      )
    }

    if (section === 'widgets') {
      // Seed defaults if empty
      const count = await db.dashboardWidget.count()
      if (count === 0) {
        await db.dashboardWidget.createMany({ data: DEFAULT_WIDGETS })
      }

      const widgets = await db.dashboardWidget.findMany({
        orderBy: { order: 'asc' },
      })

      return NextResponse.json({
        success: true,
        widgets: widgets.map((w) => ({
          id: w.id,
          widgetKey: w.widgetKey,
          title: w.title,
          type: w.type,
          config: w.config,
          dataSource: w.dataSource,
          size: w.size,
          order: w.order,
          isVisible: w.isVisible,
          refreshedAt: w.refreshedAt?.toISOString() || null,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
        })),
      })
    }

    if (section === 'themes') {
      // Seed defaults if empty
      const count = await db.platformTheme.count()
      if (count === 0) {
        for (const theme of Object.values(DEFAULT_THEMES)) {
          await db.platformTheme.create({ data: theme })
        }
      }

      const themes = await db.platformTheme.findMany({
        orderBy: { createdAt: 'asc' },
      })

      return NextResponse.json({
        success: true,
        themes: themes.map((t) => ({
          id: t.id,
          key: t.key,
          name: t.name,
          primaryColor: t.primaryColor,
          secondaryColor: t.secondaryColor,
          accentColor: t.accentColor,
          backgroundColor: t.backgroundColor,
          sidebarStyle: t.sidebarStyle,
          sidebarColor: t.sidebarColor,
          topbarStyle: t.topbarStyle,
          borderRadius: t.borderRadius,
          fontFamily: t.fontFamily,
          customCSS: t.customCSS,
          logo: t.logo,
          favicon: t.favicon,
          loginBackground: t.loginBackground,
          isActive: t.isActive,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      })
    }

    if (section === 'sidebar') {
      // Seed defaults if empty
      const count = await db.sidebarConfig.count()
      if (count === 0) {
        await db.sidebarConfig.createMany({ data: DEFAULT_SIDEBAR_ITEMS })
      }

      const items = await db.sidebarConfig.findMany({
        orderBy: { order: 'asc' },
      })

      return NextResponse.json({
        success: true,
        items: items.map((s) => ({
          id: s.id,
          key: s.key,
          label: s.label,
          icon: s.icon,
          targetPage: s.targetPage,
          order: s.order,
          isVisible: s.isVisible,
          parentId: s.parentId,
          badge: s.badge,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      })
    }

    return NextResponse.json({ success: false, message: 'Unknown section' }, { status: 400 })
  } catch (error) {
    console.error('Dynamic config GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required.' },
        { status: 400 }
      )
    }

    // ── Widget actions ──────────────────────────────────────────────────────
    if (action === 'save_widget') {
      const { id, widgetKey, title, type, config, dataSource, size, order, isVisible } = body

      if (!widgetKey || !title || !type || !size) {
        return NextResponse.json(
          { success: false, message: 'widgetKey, title, type, and size are required.' },
          { status: 400 }
        )
      }

      if (id) {
        // Update existing widget
        const existing = await db.dashboardWidget.findUnique({ where: { id } })
        if (!existing) {
          return NextResponse.json(
            { success: false, message: 'Widget not found.' },
            { status: 404 }
          )
        }

        const updated = await db.dashboardWidget.update({
          where: { id },
          data: {
            widgetKey: widgetKey.trim(),
            title: title.trim(),
            type,
            config: config || null,
            dataSource: dataSource || null,
            size,
            order: order ?? existing.order,
            isVisible: isVisible ?? existing.isVisible,
          },
        })

        return NextResponse.json({
          success: true,
          widget: serializeWidget(updated),
          message: 'Widget updated successfully.',
        })
      } else {
        // Create new widget
        const existing = await db.dashboardWidget.findUnique({ where: { widgetKey: widgetKey.trim() } })
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'A widget with this key already exists.' },
            { status: 409 }
          )
        }

        const widget = await db.dashboardWidget.create({
          data: {
            widgetKey: widgetKey.trim(),
            title: title.trim(),
            type,
            config: config || null,
            dataSource: dataSource || null,
            size,
            order: order ?? 0,
            isVisible: isVisible ?? true,
          },
        })

        return NextResponse.json({
          success: true,
          widget: serializeWidget(widget),
          message: 'Widget created successfully.',
        })
      }
    }

    if (action === 'delete_widget') {
      const { id } = body
      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Widget ID is required.' },
          { status: 400 }
        )
      }

      const existing = await db.dashboardWidget.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Widget not found.' },
          { status: 404 }
        )
      }

      await db.dashboardWidget.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'Widget deleted.' })
    }

    if (action === 'reorder_widgets') {
      const { widgetIds } = body
      if (!Array.isArray(widgetIds) || widgetIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'widgetIds array is required.' },
          { status: 400 }
        )
      }

      // Update order for each widget in a transaction
      await db.$transaction(
        widgetIds.map((wid: string, index: number) =>
          db.dashboardWidget.update({
            where: { id: wid },
            data: { order: index },
          })
        )
      )

      return NextResponse.json({ success: true, message: 'Widgets reordered.' })
    }

    // ── Theme actions ───────────────────────────────────────────────────────
    if (action === 'save_theme') {
      const {
        id, key, name, primaryColor, secondaryColor, accentColor,
        backgroundColor, sidebarStyle, sidebarColor, topbarStyle,
        borderRadius, fontFamily, customCSS, logo, favicon, loginBackground,
      } = body

      if (!key || !name) {
        return NextResponse.json(
          { success: false, message: 'Key and name are required.' },
          { status: 400 }
        )
      }

      const themeData = {
        key: key.trim(),
        name: name.trim(),
        primaryColor: primaryColor || '#d97706',
        secondaryColor: secondaryColor || null,
        accentColor: accentColor || '#d97706',
        backgroundColor: backgroundColor || '#ffffff',
        sidebarStyle: sidebarStyle || 'default',
        sidebarColor: sidebarColor || '#ffffff',
        topbarStyle: topbarStyle || 'default',
        borderRadius: borderRadius || '0.75rem',
        fontFamily: fontFamily || 'Inter',
        customCSS: customCSS || null,
        logo: logo || null,
        favicon: favicon || null,
        loginBackground: loginBackground || null,
      }

      if (id) {
        // Update existing theme
        const existing = await db.platformTheme.findUnique({ where: { id } })
        if (!existing) {
          return NextResponse.json(
            { success: false, message: 'Theme not found.' },
            { status: 404 }
          )
        }

        const updated = await db.platformTheme.update({
          where: { id },
          data: themeData,
        })

        return NextResponse.json({
          success: true,
          theme: serializeTheme(updated),
          message: 'Theme updated successfully.',
        })
      } else {
        // Create new theme — check unique key
        const existing = await db.platformTheme.findUnique({ where: { key: key.trim() } })
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'A theme with this key already exists. Use edit instead.' },
            { status: 409 }
          )
        }

        const theme = await db.platformTheme.create({
          data: {
            ...themeData,
            isActive: true,
          },
        })

        return NextResponse.json({
          success: true,
          theme: serializeTheme(theme),
          message: 'Theme created successfully.',
        })
      }
    }

    if (action === 'apply_theme') {
      const { id } = body
      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Theme ID is required.' },
          { status: 400 }
        )
      }

      const theme = await db.platformTheme.findUnique({ where: { id } })
      if (!theme) {
        return NextResponse.json(
          { success: false, message: 'Theme not found.' },
          { status: 404 }
        )
      }

      // Deactivate all themes with the same key, then activate this one
      await db.$transaction([
        db.platformTheme.updateMany({
          where: { key: theme.key },
          data: { isActive: false },
        }),
        db.platformTheme.update({
          where: { id },
          data: { isActive: true },
        }),
      ])

      return NextResponse.json({ success: true, message: 'Theme applied successfully.' })
    }

    if (action === 'reset_theme') {
      const { key } = body
      if (!key) {
        return NextResponse.json(
          { success: false, message: 'Theme key is required.' },
          { status: 400 }
        )
      }

      const defaults = DEFAULT_THEMES[key]
      if (!defaults) {
        return NextResponse.json(
          { success: false, message: 'No default theme found for this key.' },
          { status: 404 }
        )
      }

      // Delete existing themes for this key and recreate with defaults
      await db.platformTheme.deleteMany({ where: { key } })
      const theme = await db.platformTheme.create({
        data: { ...defaults, isActive: true },
      })

      return NextResponse.json({
        success: true,
        theme: serializeTheme(theme),
        message: 'Theme reset to defaults.',
      })
    }

    // ── Sidebar actions ─────────────────────────────────────────────────────
    if (action === 'save_sidebar_item') {
      const { id, key, label, icon, targetPage, order, isVisible, parentId, badge } = body

      if (!key || !label || !icon || !targetPage) {
        return NextResponse.json(
          { success: false, message: 'Key, label, icon, and targetPage are required.' },
          { status: 400 }
        )
      }

      const itemData = {
        key: key.trim(),
        label: label.trim(),
        icon,
        targetPage,
        order: order ?? 0,
        isVisible: isVisible ?? true,
        parentId: parentId || null,
        badge: badge || null,
      }

      if (id) {
        // Update
        const existing = await db.sidebarConfig.findUnique({ where: { id } })
        if (!existing) {
          return NextResponse.json(
            { success: false, message: 'Sidebar item not found.' },
            { status: 404 }
          )
        }

        const updated = await db.sidebarConfig.update({
          where: { id },
          data: itemData,
        })

        return NextResponse.json({
          success: true,
          item: serializeSidebarItem(updated),
          message: 'Sidebar item updated.',
        })
      } else {
        // Create — check unique key
        const existing = await db.sidebarConfig.findUnique({ where: { key: key.trim() } })
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'A sidebar item with this key already exists.' },
            { status: 409 }
          )
        }

        const item = await db.sidebarConfig.create({ data: itemData })

        return NextResponse.json({
          success: true,
          item: serializeSidebarItem(item),
          message: 'Sidebar item created.',
        })
      }
    }

    if (action === 'delete_sidebar_item') {
      const { id } = body
      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Sidebar item ID is required.' },
          { status: 400 }
        )
      }

      const existing = await db.sidebarConfig.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Sidebar item not found.' },
          { status: 404 }
        )
      }

      // Also delete children with this parentId
      await db.sidebarConfig.deleteMany({ where: { parentId: id } })
      await db.sidebarConfig.delete({ where: { id } })

      return NextResponse.json({ success: true, message: 'Sidebar item deleted.' })
    }

    if (action === 'reorder_sidebar') {
      const { itemIds } = body as { itemIds: string[] }
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'itemIds array is required.' },
          { status: 400 }
        )
      }

      await db.$transaction(
        itemIds.map((iid: string, index: number) =>
          db.sidebarConfig.update({
            where: { id: iid },
            data: { order: index },
          })
        )
      )

      return NextResponse.json({ success: true, message: 'Sidebar reordered.' })
    }

    return NextResponse.json(
      { success: false, message: `Unknown action: ${action}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('Dynamic config POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// ── Serializers ──────────────────────────────────────────────────────────────
function serializeWidget(w: {
  id: string
  widgetKey: string
  title: string
  type: string
  config: string | null
  dataSource: string | null
  size: string
  order: number
  isVisible: boolean
  refreshedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: w.id,
    widgetKey: w.widgetKey,
    title: w.title,
    type: w.type,
    config: w.config,
    dataSource: w.dataSource,
    size: w.size,
    order: w.order,
    isVisible: w.isVisible,
    refreshedAt: w.refreshedAt?.toISOString() || null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }
}

function serializeTheme(t: {
  id: string
  key: string
  name: string
  primaryColor: string
  secondaryColor: string | null
  accentColor: string
  backgroundColor: string
  sidebarStyle: string
  sidebarColor: string
  topbarStyle: string
  borderRadius: string
  fontFamily: string
  customCSS: string | null
  logo: string | null
  favicon: string | null
  loginBackground: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: t.id,
    key: t.key,
    name: t.name,
    primaryColor: t.primaryColor,
    secondaryColor: t.secondaryColor,
    accentColor: t.accentColor,
    backgroundColor: t.backgroundColor,
    sidebarStyle: t.sidebarStyle,
    sidebarColor: t.sidebarColor,
    topbarStyle: t.topbarStyle,
    borderRadius: t.borderRadius,
    fontFamily: t.fontFamily,
    customCSS: t.customCSS,
    logo: t.logo,
    favicon: t.favicon,
    loginBackground: t.loginBackground,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

function serializeSidebarItem(s: {
  id: string
  key: string
  label: string
  icon: string
  targetPage: string
  order: number
  isVisible: boolean
  parentId: string | null
  badge: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    key: s.key,
    label: s.label,
    icon: s.icon,
    targetPage: s.targetPage,
    order: s.order,
    isVisible: s.isVisible,
    parentId: s.parentId,
    badge: s.badge,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}
