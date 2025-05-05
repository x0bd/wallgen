"use client"

import { WidgetContainer } from "@/components/widgets/widget-container"
import { ParametersWidget } from "@/components/widgets/parameters-widget"
import { ColorWidget } from "@/components/widgets/color-widget"
import { ExportWidget } from "@/components/widgets/export-widget"

export function WidgetSidebar() {
  return (
    <WidgetContainer position="right">
      <ParametersWidget />
      <ColorWidget />
      <ExportWidget />
    </WidgetContainer>
  )
} 