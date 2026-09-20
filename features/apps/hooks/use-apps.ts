"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteApp, getApps, updateApp, type UpdateAppInput } from "../api/apps"

export const appsQueryKey = ["apps"] as const

export function useApps() {
  return useQuery({
    queryKey: appsQueryKey,
    queryFn: getApps,
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appsQueryKey }),
  })
}

export function useUpdateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appId, input }: { appId: string; input: UpdateAppInput }) =>
      updateApp(appId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appsQueryKey }),
  })
}
