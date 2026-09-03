import { useState, useEffect } from "react";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { compressAndOptimizeImage } from "@/lib/image-upload";
import { Image as ImageIcon2 } from "lucide-react";

type HeroImageUploaderProps = {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  onSave: (url: string | null) => Promise<boolean>;
  onRefresh?: () => void;
  fieldKey: "hero2" | "hero3" | "hero4";
};

export function HeroImageUploader({
  label,
  description,
  value,
  onChange,
  onSave,
  onRefresh,
  fieldKey,
}: HeroImageUploaderProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      toast.loading(`Uploading ${fieldKey} banner...`, { id: `${fieldKey}-upload` });
      const { dataUrl, blob } = await compressAndOptimizeImage(file, 1920, 823, 0.9);

      const fileName = `${fieldKey}_banner_${Date.now()}.webp`;
      const filePath = `hero/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, blob, {
          cacheControl: "31536000",
          upsert: true,
          contentType: blob.type || "image/webp",
        });

      if (!uploadError && uploadData) {
        const { data: pubData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          onChange(pubData.publicUrl);
          const ok = await onSave(pubData.publicUrl);
          if (ok) onRefresh?.();
          toast.success(`${label} uploaded & saved!`, { id: `${fieldKey}-upload` });
          return;
        }
      }

      onChange(dataUrl);
      const ok = await onSave(dataUrl);
      if (ok) onRefresh?.();
      toast.success(`${label} saved!`, { id: `${fieldKey}-upload` });
    } catch {
      toast.error("Failed to upload image", { id: `${fieldKey}-upload` });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-[#E8E4DA] p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-semibold text-[#1F2924]">{label}</Label>
          {description && (
            <p className="text-[10px] text-[#6B746F] mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-[#145A45]/20 bg-[#E6EFE8] hover:bg-[#D4E8DC] px-3 py-1.5 text-[11px] font-bold text-[#145A45] transition-all">
          <Upload className="size-3.5" />
          <span>{value ? "Change Image" : "Upload from Device"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <span className="text-[10px] text-[#6B746F]">or</span>

        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL here..."
            className="rounded-xl border-[#E8E4DA] text-xs h-8"
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={async () => {
              onChange("");
              const ok = await onSave(null);
              if (ok) onRefresh?.();
              toast.success(`${label} removed!`);
            }}
            className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 p-1.5 text-red-500 transition-all"
            title="Remove image"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-[10px] text-[#6B746F]">
        Recommended: 1920×823px (21:9 ultra-wide). Max 5MB.
      </p>

      {value ? (
        <div className="mt-2 rounded-xl overflow-hidden border border-[#E8E4DA] shadow-xs relative">
          <img
            src={value}
            alt={`${label} preview`}
            className="w-full aspect-[21/9] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="mt-2 rounded-xl border-2 border-dashed border-[#E8E4DA] bg-[#FAF8F2] flex flex-col items-center justify-center aspect-[21/9] gap-1.5">
          <ImageIcon className="size-6 text-[#C5BEA8]" />
          <p className="text-[11px] text-[#9B9585] font-medium">No {label.toLowerCase()} set</p>
          <p className="text-[10px] text-[#C5BEA8]">Upload or paste a URL above</p>
        </div>
      )}
    </div>
  );
}
