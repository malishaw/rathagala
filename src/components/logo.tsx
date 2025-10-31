import { Car } from "lucide-react";


export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-white rounded-lg p-2 shadow-md">
        <Car className="h-8 w-8 text-teal-700" strokeWidth={2.5} />
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">
        Rathagala<span className="text-teal-300">.lk</span>
      </span>
    </div>
  );
}
