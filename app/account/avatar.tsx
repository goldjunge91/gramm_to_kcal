"use client";
import Image from "next/image";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";

export default function Avatar({
  url,
  size,
  onUpload,
}: {
  uid: string | null;
  url: string | null;
  size: number;
  onUpload: (url: string) => void;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      
      // For Better Auth, we'll just create a local URL for now
      // In a real implementation, you'd upload to your preferred storage service
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
      onUpload(imageUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {avatarUrl ? (
        <Image
          width={size}
          height={size}
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full border"
          style={{ height: size, width: size }}
        />
      ) : (
        <div
          className="bg-muted rounded-full border flex items-center justify-center text-muted-foreground"
          style={{ height: size, width: size }}
        >
          No Image
        </div>
      )}
      <div>
        <Button asChild disabled={uploading}>
          <label htmlFor="avatar-upload" className="cursor-pointer">
            {uploading ? "Uploading..." : "Upload Avatar"}
          </label>
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
