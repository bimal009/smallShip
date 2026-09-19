"use client"

import { useQuery } from "@tanstack/react-query"
import { getApps } from "../api/apps"

export const appsQueryKey = ["apps"] as const

export function useApps() {
  return useQuery({
    queryKey: appsQueryKey,
    queryFn: getApps,
  })
}
