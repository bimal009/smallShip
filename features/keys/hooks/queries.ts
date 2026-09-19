"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createKey, deleteKey, getKeys } from "../api/keys"

export const keysQueryKey = ["api-keys"] as const

export function useKeys() {
  return useQuery({
    queryKey: keysQueryKey,
    queryFn: ({ signal }) => getKeys(signal),
  })
}

export function useCreateKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createKey,
    gcTime: 0,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keysQueryKey }),
  })
}

export function useDeleteKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keysQueryKey }),
  })
}
