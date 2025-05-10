import React, { useRef } from 'react';
import { useAlgorithm } from '@/context/algorithm-context';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, Image } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ToggleWidget } from '@/components/ui/toggle-widget';

const ImageUploadWidget = () => {
  const { params, updateParams, uploadImage, resetImage } = useAlgorithm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleResetClick = () => {
    resetImage();
  };

  // Slider handlers for stroke parameters
  const handleStrokeLengthChange = (value: number[]) => {
    updateParams({ strokeLength: value[0] });
  };

  const handleStrokeThicknessChange = (value: number[]) => {
    updateParams({ strokeThickness: value[0] });
  };

  return (
    <ToggleWidget
      title="Image Settings"
      icon={<Image size={14} />}
      className="w-full"
    >
      <div className="space-y-5">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="flex gap-3">
          <Button 
            onClick={handleUploadClick} 
            className="flex-1 flex gap-2 items-center"
            variant="outline"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Image</span>
          </Button>
          
          <Button 
            onClick={handleResetClick}
            className="flex gap-2 items-center"
            variant="ghost"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Image preview removed as it wasn't working correctly */}

        <div className="space-y-2.5">
          <label className="text-xs font-mono tracking-tight block">Stroke Length</label>
          <Slider
            id="stroke-length"
            min={5}
            max={40}
            step={1}
            value={[params.strokeLength || 15]}
            onValueChange={handleStrokeLengthChange}
          />
          <div className="flex justify-end">
            <span className="text-xs font-mono opacity-50">{params.strokeLength}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-xs font-mono tracking-tight block">Stroke Thickness</label>
          <Slider
            id="stroke-thickness"
            min={10}
            max={100}
            step={5}
            value={[params.strokeThickness || 50]}
            onValueChange={handleStrokeThicknessChange}
          />
          <div className="flex justify-end">
            <span className="text-xs font-mono opacity-50">{params.strokeThickness}</span>
          </div>
        </div>
      </div>
    </ToggleWidget>
  );
};

export default ImageUploadWidget; 