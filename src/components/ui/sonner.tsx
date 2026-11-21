import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0C2D22]/95 group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-emerald-500/25 group-[.toaster]:shadow-[0_8px_24px_rgba(0,0,0,0.35)] group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-md group-[.toaster]:font-sans text-xs sm:text-sm font-semibold py-2.5 px-4",
          description: "group-[.toast]:text-emerald-200/80 text-[11px] sm:text-xs font-normal mt-0.5",
          actionButton: "group-[.toast]:bg-emerald-600 group-[.toast]:text-white rounded-xl font-bold px-3 py-1",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white rounded-xl px-3 py-1",
          success: "!bg-[#0C382A] !text-white !border-emerald-400/35",
          error: "!bg-[#3D0F0F] !text-white !border-rose-400/35",
          info: "!bg-[#0D2838] !text-white !border-cyan-400/35",
          warning: "!bg-[#3A2607] !text-white !border-amber-400/35",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
