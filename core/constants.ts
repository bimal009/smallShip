export const SANDBOX_ROOT = process.env.SANDBOX_ROOT ?? "/var/shipsmall/sandboxes"
export const BUILD_ROOT = process.env.BUILD_ROOT ?? "/var/shipsmall/builds"

export const sandboxWorkspacePath = (appId: string) => `${SANDBOX_ROOT}/${appId}`
export const buildWorkspacePath = (appId: string) => `${BUILD_ROOT}/${appId}`