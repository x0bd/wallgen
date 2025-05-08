"use client"

import { WidgetContainer } from "@/components/widgets/widget-container"
import { ParametersWidget } from "@/components/widgets/parameters-widget"
import { ColorWidget } from "@/components/widgets/color-widget"
import { ExportWidget } from "@/components/widgets/export-widget"
import ImageUploadWidget from "@/components/widgets/image-upload-widget"
import { useAlgorithm } from "@/context/algorithm-context"

export function WidgetSidebar() {
  const { algorithm } = useAlgorithm();
  
  return (
    <WidgetContainer position="right">
      {algorithm === 'flowImage' && (
        <ImageUploadWidget />
      )}
      <ParametersWidget />
      <ColorWidget />
      <ExportWidget />
    </WidgetContainer>
  )
} 