"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, CloudUpload, Palette, Sparkle, Star, Tag } from "lucide-react";

type Wallpaper = {
  id: string;
  title: string;
  category: string;
  isFeatured: boolean;
  imageUrl: string;
};

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const fetchWallpapers = async () => {
    try {
      const response = await fetch("/api/wallpapers");
      if (!response.ok) throw new Error("Failed to fetch wallpapers");
      const data = await response.json();
      setWallpapers(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not load wallpapers.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, closeModal: () => void) => {
    e.preventDefault();

    if (!image) {
      toast({
        title: "Error",
        description: "Please upload an image.",
      });
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("isFeatured", isFeatured.toString());
    formData.append("image", image);

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch("/api/wallpapers", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "Success",
        description: "Wallpaper uploaded successfully.",
      });

      setTitle("");
      setCategory("");
      setIsFeatured(false);
      setImage(null);
      closeModal();
      fetchWallpapers();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to upload wallpaper.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toCamelCase = (str: string) => {
    return str
      .split(/[\s-_]/) // split by space, dash, underscore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Make a new DreamWalls
            </h1>
            <p className="text-muted-foreground">
              Upload a new wallpaper and share it with the world
            </p>
          </div>
          {/* Upload Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <CloudUpload className="mr-2 h-4 w-4" />
                Upload DreamWalls
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New DreamWalls</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const closeModal = () =>
                    document.querySelector("dialog")?.close();
                  handleSubmit(e, closeModal);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value)}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value="abstract">Abstract</SelectItem>
                      <SelectItem value="amoled">Amoled</SelectItem>
                      <SelectItem value="animal">Animal</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                      <SelectItem value="games">Games</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="shapes">Shapes</SelectItem>
                      <SelectItem value="shows">Shows</SelectItem>
                      <SelectItem value="space">Space</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="superheroes">Superheroes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={(checked) =>
                      setIsFeatured(checked as boolean)
                    }
                  />
                  <Label htmlFor="isFeatured">Mark as Featured</Label>
                </div>

                <div>
                  <Label htmlFor="image">Image</Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <label
                      htmlFor="image"
                      className="cursor-pointer rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
                    >
                      Choose File
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {image ? image.name : "No file chosen"}
                    </span>
                  </div>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={(e) =>
                      setImage(e.target.files ? e.target.files[0] : null)
                    }
                    className="hidden"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload DreamWalls"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Wallpapers Gallery */}
        <Card className="p-5">
          <div>
            <h2 className="text-xl font-semibold mb-4">Uploaded Wallpapers</h2>

            {wallpapers.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No wallpapers uploaded yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {wallpapers.map((wallpaper) => (
                  <div
                    key={wallpaper.id || wallpaper.title}
                    className="flex flex-col space-y-2 group w-full max-w-[220px]"
                  >
                    {/* Phone Mockup */}
                    <div className="w-full h-[300px] bg-black rounded-3xl p-2 shadow-md relative overflow-hidden">
                      {/* Screen Area */}
                      <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                        <img
                          src={wallpaper.imageUrl}
                          alt={wallpaper.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Overlay Details */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-2">
                          <div className="flex items-center mb-2">
                            {wallpaper.isFeatured && (
                              <span className="inline-block px-3 py-1 text-xs text-white bg-primary rounded-lg">
                                Featured
                              </span>
                            )}
                          </div>

                          <h3 className="flex items-center gap-1 text-white font-bold text-sm truncate">
                            <Sparkle className="h-3 w-3 mr-1" />
                            {wallpaper.title}
                          </h3>

                          {wallpaper.category && (
                            <div className="flex items-center gap-1 text-xs text-white/80 font-bold truncate">
                              <Tag className="h-3 w-3 mr-1" />
                              <span className="">
                                {toCamelCase(wallpaper.category)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
