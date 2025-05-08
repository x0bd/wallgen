import React, { useRef } from 'react';
import { useAlgorithm } from '@/context/algorithm-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Image Settings</CardTitle>
        <CardDescription>Upload an image for the flow image effect</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="stroke-length">Stroke Length</Label>
            <span className="text-sm text-muted-foreground">{params.strokeLength}</span>
          </div>
          <Slider
            id="stroke-length"
            min={5}
            max={40}
            step={1}
            value={[params.strokeLength || 15]}
            onValueChange={handleStrokeLengthChange}
          />
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="stroke-thickness">Stroke Thickness</Label>
            <span className="text-sm text-muted-foreground">{params.strokeThickness}</span>
          </div>
          <Slider
            id="stroke-thickness"
            min={10}
            max={100}
            step={5}
            value={[params.strokeThickness || 50]}
            onValueChange={handleStrokeThicknessChange}
          />
        </div>

        {/* Show current image preview if available */}
        {params.imageUrl && (
          <div className="mt-4">
            <Label>Current Image</Label>
            <div className="mt-2 border rounded overflow-hidden">
              <img
                src={params.imageUrl}
                alt="Flow Image"
                className="w-full h-auto object-cover"
                style={{ maxHeight: "150px" }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUploadWidget; 