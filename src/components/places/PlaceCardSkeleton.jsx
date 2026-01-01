import { Skeleton } from "@/components/ui/Skeleton"

export function PlaceCardSkeleton() {
    return (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            {/* Icon Placeholder */}
            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />

            <div className="flex-1 min-w-0 space-y-2">
                {/* Title Placeholder */}
                <Skeleton className="h-5 w-3/4 rounded-lg" />

                {/* Address Placeholder */}
                <Skeleton className="h-3 w-1/2 rounded-md" />

                {/* Badges Placeholder */}
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
            </div>

            {/* Right Side Stats Placeholder */}
            <div className="flex flex-col items-end gap-2 pl-2">
                <Skeleton className="h-8 w-12 rounded-xl" />
                <Skeleton className="h-3 w-10 rounded-md" />
            </div>
        </div>
    )
}
