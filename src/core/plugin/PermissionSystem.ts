/*
 * Central permission registry for the plugin framework.
 * Each plugin declares a list of requiredPermissions in its manifest (see PluginSystem).
 * At runtime we store which permissions have been granted for a particular plugin ID
 * and expose helper functions to query them.
 */

export const permissionDescriptions: Record<string, string> = {
  'read-tasks': 'Read your tasks and projects',
  'modify-tasks': 'Create, edit and delete tasks',
  'read-finances': 'Access your financial data',
  // add new permissions below as the platform grows
  'modify-finances': 'Create, edit and delete financial records',
  'read-habits': 'Read your habit tracker data',
  'modify-habits': 'Create, edit and delete habits',
};

// Internal in-memory store of granted permissions.
// In the future this could be persisted to IndexedDB or secure storage.
const grantedPermissions: Map<string, Set<string>> = new Map();

/**
 * Grant a permission to a plugin (e.g. after user confirmation in a dialog).
 */
export function grantPermission(pluginId: string, permission: string): void {
  if (!permissionDescriptions[permission]) {
    throw new Error(`Unknown permission: ${permission}`);
  }
  const current = grantedPermissions.get(pluginId) ?? new Set<string>();
  current.add(permission);
  grantedPermissions.set(pluginId, current);
}

/**
 * Revoke a previously granted permission.
 */
export function revokePermission(pluginId: string, permission: string): void {
  grantedPermissions.get(pluginId)?.delete(permission);
}

/**
 * Check if a plugin currently holds a given permission.
 * Returns true if the permission has been granted.
 */
export function validatePermission(pluginId: string, permission: string): boolean {
  return grantedPermissions.get(pluginId)?.has(permission) ?? false;
}
