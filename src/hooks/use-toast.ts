import { toast as toastify } from "react-toastify";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

function toast({ title, description, variant }: ToastOptions) {
  const message = description ? `${title}\n${description}` : title;

  if (variant === "destructive") {
    toastify.error(message);
  } else {
    toastify.success(message);
  }
}

function useToast() {
  return {
    toast,
  };
}

export { useToast, toast };
