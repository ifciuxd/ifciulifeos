import React, { useState, useEffect } from 'react';
import { pluginSystem } from '../../../core/plugin/PluginSystem';
import GlassCard from '../../layout/GlassCard';
import { FiDownload, FiTrash2, FiPower, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const PluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState(pluginSystem.getInstalledPlugins());
  const [activePlugins, setActivePlugins] = useState(pluginSystem.getActivePlugins());
  const [newPluginUrl, setNewPluginUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshPlugins = () => {
    setPlugins(pluginSystem.getInstalledPlugins());
    setActivePlugins(pluginSystem.getActivePlugins());
  };

  const handleInstallPlugin = async () => {
    if (!newPluginUrl) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await pluginSystem.loadPlugin(newPluginUrl);
      refreshPlugins();
      setNewPluginUrl('');
    } catch (err) {
      setError('Failed to install plugin. Check the URL and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlugin = (pluginId: string) => {
    const isActive = activePlugins.some(p => p.id === pluginId);
    
    if (isActive) {
      pluginSystem.disablePlugin(pluginId);
    } else {
      pluginSystem.enablePlugin(pluginId);
    }
    
    refreshPlugins();
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-2xl font-bold mb-6">Plugin Manager</h2>
      
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <input
            type="text"
            value={newPluginUrl}
            onChange={(e) => setNewPluginUrl(e.target.value)}
            placeholder="Enter plugin URL (raw JS file)"
            className="flex-1 bg-ifciu-secondaryBg border border-ifciu-tertiaryBg rounded-l-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-ifciu-accentPrimary"
          />
          <button
            onClick={handleInstallPlugin}
            disabled={isLoading || !newPluginUrl}
            className="bg-ifciu-accentPrimary text-ifciu-primaryBg px-4 py-2 rounded-r-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center"
          >
            {isLoading ? 'Installing...' : (
              <>
                <FiDownload className="mr-2" />
                Install
              </>
            )}
          </button>
        </div>
        {error && <p className="text-ifciu-error text-sm">{error}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Installed Plugins ({plugins.length})</h3>
        
        <AnimatePresence>
          {plugins.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-ifciu-textSecondary text-center py-8"
            >
              No plugins installed yet. Add your first plugin above.
            </motion.div>
          ) : (
            plugins.map(plugin => (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-lg bg-ifciu-secondaryBg border border-ifciu-tertiaryBg"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-bold text-lg mr-3">{plugin.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-ifciu-tertiaryBg">
                        v{plugin.version}
                      </span>
                    </div>
                    <p className="text-ifciu-textSecondary text-sm mt-1">{plugin.description}</p>
                    <div className="mt-3">
                      <div className="text-xs text-ifciu-textSecondary">
                        <strong>Author:</strong> {plugin.author}
                      </div>
                      <div className="text-xs text-ifciu-textSecondary mt-1">
                        <strong>Permissions:</strong> {plugin.requiredPermissions.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`p-2 rounded-lg flex items-center justify-center ${
                        activePlugins.some(p => p.id === plugin.id)
                          ? 'bg-ifciu-success text-ifciu-primaryBg'
                          : 'bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg'
                      }`}
                    >
                      <FiPower />
                    </button>
                    <button className="p-2 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg">
                      <FiSettings />
                    </button>
                    <button className="p-2 rounded-lg bg-ifciu-error bg-opacity-20 hover:bg-opacity-30 text-ifciu-error">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};