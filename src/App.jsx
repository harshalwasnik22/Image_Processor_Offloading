import React, { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Upload,
  Download,
  FlipHorizontal,
  FlipVertical,
  Palette,
  Filter,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ImageProcessor = () => {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic adjustments
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Effects
  const [effectType, setEffectType] = useState("none");
  const [effectStrength, setEffectStrength] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [noise, setNoise] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(false);

  const [invert, setInvert] = useState(false);
  // Additional state variables for tint and color enhancement
  const [tintColor, setTintColor] = useState(""); // Default tint color (red)
  const [colorEnhance, setColorEnhance] = useState(100); // Default color enhancement level

  // Transform
  const [rotation, setRotation] = useState(0);
  const [horizontalFlip, setHorizontalFlip] = useState(null);
  const [verticalFlip, setVerticalFlip] = useState(null);

  // Filter

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const captureImage = async () => {
    try {
      setCapturing(true); // Set capturing mode
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const takeSnapshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setImage(imageDataUrl);
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop()); // Stop the video stream
    setCapturing(false); // Disable capturing mode
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    try {
      const response = await fetch(
        "https://gui5sv2mn4.execute-api.ap-south-1.amazonaws.com/devv/process-image",
        {
          method: "POST",
          // mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: image.split(",")[1],
            width,
            height,
            effectType,
            effectStrength,
            rotation,
            brightness,
            contrast,
            saturation,
            sharpen,
            noise,
            vignette,
            sepia,
            applyGray: grayscale, // explicitly match the variable
            invertColors: invert,
            horizontalFlip,
            verticalFlip,
            tintColor, // Include tint color in the request
            colorEnhance,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data.processedImage);
        setProcessedImage(`data:image/jpeg;base64,${data.processedImage}`);
      } else {
        console.error("Error processing image:", response.statusText);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "processed-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Image Processor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-col md:grid md:grid-cols-2 gap-4">
            <div className="pb-4">
              <h3 className="text-lg font-semibold mb-2">Original Image</h3>
              {capturing ? (
                <video ref={videoRef} className="w-full h-auto" />
              ) : image ? (
                <img src={image} alt="Original" className="w-full h-auto" />
              ) : (
                <div className="bg-gray-200 w-full h-64 flex items-center justify-center">
                  <div className="text-gray-400 text-4xl">No Image</div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Image
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  onClick={capturing ? takeSnapshot : captureImage}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />{" "}
                  {capturing ? "Take Snapshot" : "Capture Image"}
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Processed Image</h3>
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-auto"
                />
              ) : (
                <div className="bg-gray-200 w-full h-64 flex items-center justify-center">
                  <div className="text-gray-400 text-4xl">
                    No Processed Image
                  </div>
                </div>
              )}
              <Button
                onClick={downloadImage}
                className="mt-4 w-full"
                disabled={!processedImage}
              >
                <Download className="mr-2 h-4 w-4" /> Download Processed Image
              </Button>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Tabs defaultValue="basic" className="mt-8">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="transform">Transform</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                {/* Existing sliders for width, height, brightness, contrast, etc. */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brightness - {brightness}
                  </label>
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contrast - {contrast}
                  </label>
                  <Slider
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Saturation - {saturation}
                  </label>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sharpen - {sharpen}
                  </label>
                  <Slider
                    value={[sharpen]}
                    onValueChange={(value) => setSharpen(value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Noise - {noise}
                  </label>
                  <Slider
                    value={[noise]}
                    onValueChange={(value) => setNoise(value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vignette - {vignette}
                  </label>
                  <Slider
                    value={[vignette]}
                    onValueChange={(value) => setVignette(value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sepia - {sepia}
                  </label>
                  <Slider
                    value={[sepia]}
                    onValueChange={(value) => setSepia(value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Color Enhancement - {colorEnhance}
                  </label>
                  <Slider
                    value={[colorEnhance]}
                    onValueChange={(value) => setColorEnhance(value[0])}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tint Color
                  </label>
                  <input
                    type="color"
                    value={tintColor}
                    onChange={(e) => setTintColor(e.target.value)}
                    className="w-full h-10 border rounded"
                    disabled={grayscale} // Disable tint color input if grayscale is active
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant={grayscale ? "default" : "outline"}
                    onClick={() => {
                      setGrayscale(!grayscale);
                      if (!grayscale) {
                        setTintColor(""); // Reset tint color when enabling grayscale
                      }
                    }}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Grayscale
                  </Button>
                  <Button
                    variant={invert ? "default" : "outline"}
                    onClick={() => setInvert(!invert)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Invert
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="transform" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Width (%) - {width}
                  </label>
                  <Slider
                    value={[width]}
                    onValueChange={(value) => setWidth(value[0])}
                    min={10}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Height (%) - {height}
                  </label>
                  <Slider
                    value={[height]}
                    onValueChange={(value) => setHeight(value[0])}
                    min={10}
                    max={200}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rotation (degrees) - {rotation}
                  </label>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant={horizontalFlip ? "default" : "outline"}
                    onClick={() => setHorizontalFlip(!horizontalFlip)}
                  >
                    <FlipHorizontal className="mr-2 h-4 w-4" />
                    Flip Horizontal
                  </Button>
                  <Button
                    variant={verticalFlip ? "default" : "outline"}
                    onClick={() => setVerticalFlip(!verticalFlip)}
                  >
                    <FlipVertical className="mr-2 h-4 w-4" />
                    Flip Vertical
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="effects" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Effect Type
                  </label>
                  <Select value={effectType} onValueChange={setEffectType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select effect type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="gaussian">Gaussian Blur</SelectItem>
                      <SelectItem value="box">Box Blur</SelectItem>
                      <SelectItem value="radial">Radial Blur</SelectItem>
                      <SelectItem value="zoom">Zoom Blur</SelectItem>
                      <SelectItem value="lens">Lens Blur</SelectItem>
                      <SelectItem value="mosaic">Mosaic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Effect Strength - {effectStrength}
                  </label>
                  <Slider
                    value={[effectStrength]}
                    onValueChange={(value) => setEffectStrength(value[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <Button
              onClick={processImage}
              className="mt-4 w-full"
              disabled={!image || loading}
            >
              {loading ? "Processing..." : "Process Image"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageProcessor;
