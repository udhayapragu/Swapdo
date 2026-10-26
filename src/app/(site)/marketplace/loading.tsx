import { ServiceCardSkeleton } from "@/components/marketplace/service-card";

export default function Loading() {
  return (
    <div className="container-page pt-24 lg:pt-28" aria-busy="true" aria-label="Loading marketplace">
      <div className="skeleton h-4 w-28 rounded" />
      <div className="skeleton mt-4 h-12 w-2/3 max-w-lg rounded-xl" />
      <div className="skeleton mt-8 h-24 rounded-2xl" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <ServiceCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
