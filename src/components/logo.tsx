import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
      <div className="bg-white/10 rounded-lg p-2 shadow-md">
        <img 
          src="/Rathagala-Favicon.png" 
          alt="Rathagala.lk Logo" 
          className="h-8 w-8 object-contain" 
        />
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">
        Rathagala<span className="text-teal-300">.lk</span>
      </span>
    </Link>
  );
}
