
// Plugins.js - Boba Video Editor Plugin Management System

import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { toast } from 'react-toastify';
import axios from 'axios';
import { validatePlugin } from '../utils/pluginValidator';
import { applyEffect, removeEffect } from '../effects/effectManager';
import { addFont, removeFont } from '../fonts/fontManager';
import { store } from '../store/store';
import { addPlugin, removePlugin, updatePlugin } from '../store/actions/pluginActions';

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.effectPlugins = new Map();
    this.fontPlugins = new Map();
    this.otherPlugins = new Map();
  }

  async initializePlugins() {
    try {
      const storedPlugins = localStorage.getItem('bobaPlugins');
      if (storedPlugins) {
        const parsedPlugins = JSON.parse(storedPlugins);
        for (const plugin of parsedPlugins) {
          await this.loadPlugin(plugin);
        }
      }
      console.log('Plugins initialized successfully');
    } catch (error) {
      console.error('Error initializing plugins:', error);
      toast.error('Failed to initialize plugins. Please try restarting the application.');
    }
  }

  async loadPlugin(pluginData) {
    try {
      const { id, type, name, version, author, description, code } = pluginData;
      const plugin = {
        id,
        type,
        name,
        version,
        author,
        description,
        instance: null,
      };

      // Validate plugin
      const validationResult = validatePlugin(pluginData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid plugin: ${validationResult.error}`);
      }

      // Create plugin instance
      const PluginClass = eval(`(${code})`);
      plugin.instance = new PluginClass();

      // Add plugin to appropriate category
      switch (type) {
        case 'effect':
          this.effectPlugins.set(id, plugin);
          break;
        case 'font':
          this.fontPlugins.set(id, plugin);
          break;
        default:
          this.otherPlugins.set(id, plugin);
      }

      this.plugins.set(id, plugin);
      store.dispatch(addPlugin(plugin));
      console.log(`Plugin "${name}" (${id}) loaded successfully`);
    } catch (error) {
      console.error(`Error loading plugin:`, error);
      toast.error(`Failed to load plugin: ${error.message}`);
    }
  }

  async createPlugin(type, name, version, author, description, code) {
    try {
      const id = uuidv4();
      const pluginData = { id, type, name, version, author, description, code };
      
      // Validate plugin
      const validationResult = validatePlugin(pluginData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid plugin: ${validationResult.error}`);
      }

      await this.loadPlugin(pluginData);
      this.savePluginsToStorage();
      toast.success(`Plugin "${name}" created successfully`);
      return id;
    } catch (error) {
      console.error('Error creating plugin:', error);
      toast.error(`Failed to create plugin: ${error.message}`);
      return null;
    }
  }

  deletePlugin(id) {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Remove plugin from appropriate category
      switch (plugin.type) {
        case 'effect':
          this.effectPlugins.delete(id);
          removeEffect(id);
          break;
        case 'font':
          this.fontPlugins.delete(id);
          removeFont(id);
          break;
        default:
          this.otherPlugins.delete(id);
      }

      this.plugins.delete(id);
      store.dispatch(removePlugin(id));
      this.savePluginsToStorage();
      toast.success(`Plugin "${plugin.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting plugin:', error);
      toast.error(`Failed to delete plugin: ${error.message}`);
    }
  }

  updatePlugin(id, updates) {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      const updatedPlugin = { ...plugin, ...updates };
      
      // Validate updated plugin
      const validationResult = validatePlugin(updatedPlugin);
      if (!validationResult.isValid) {
        throw new Error(`Invalid plugin update: ${validationResult.error}`);
      }

      this.plugins.set(id, updatedPlugin);
      store.dispatch(updatePlugin(updatedPlugin));
      this.savePluginsToStorage();
      toast.success(`Plugin "${updatedPlugin.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating plugin:', error);
      toast.error(`Failed to update plugin: ${error.message}`);
    }
  }

  async exportPlugins(pluginIds) {
    try {
      const zip = new JSZip();
      const exportData = [];

      for (const id of pluginIds) {
        const plugin = this.plugins.get(id);
        if (plugin) {
          exportData.push({
            id: plugin.id,
            type: plugin.type,
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
            description: plugin.description,
            code: plugin.instance.toString(),
          });
        }
      }

      zip.file('plugins.json', JSON.stringify(exportData, null, 2));
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'boba_plugins_export.zip');
      toast.success('Plugins exported successfully');
    } catch (error) {
      console.error('Error exporting plugins:', error);
      toast.error(`Failed to export plugins: ${error.message}`);
    }
  }

  async importPlugins(file) {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const pluginsJson = await contents.file('plugins.json').async('string');
      const importedPlugins = JSON.parse(pluginsJson);

      for (const pluginData of importedPlugins) {
        await this.loadPlugin(pluginData);
      }

      this.savePluginsToStorage();
      toast.success(`${importedPlugins.length} plugins imported successfully`);
    } catch (error) {
      console.error('Error importing plugins:', error);
      toast.error(`Failed to import plugins: ${error.message}`);
    }
  }

  savePluginsToStorage() {
    const pluginsData = Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      type: plugin.type,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      code: plugin.instance.toString(),
    }));
    localStorage.setItem('bobaPlugins', JSON.stringify(pluginsData));
  }

  async fetchPluginFromRepository(repositoryUrl, pluginId) {
    try {
      const response = await axios.get(`${repositoryUrl}/plugins/${pluginId}`);
      const pluginData = response.data;
      await this.loadPlugin(pluginData);
      this.savePluginsToStorage();
      toast.success(`Plugin "${pluginData.name}" fetched and installed successfully`);
    } catch (error) {
      console.error('Error fetching plugin from repository:', error);
      toast.error(`Failed to fetch plugin: ${error.message}`);
    }
  }

  getPluginById(id) {
    return this.plugins.get(id);
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  getPluginsByType(type) {
    switch (type) {
      case 'effect':
        return Array.from(this.effectPlugins.values());
      case 'font':
        return Array.from(this.fontPlugins.values());
      default:
        return Array.from(this.otherPlugins.values());
    }
  }

  async runPluginMethod(pluginId, methodName, ...args) {
    try {
      const plugin = this.getPluginById(pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      if (typeof plugin.instance[methodName] !== 'function') {
        throw new Error(`Method "${methodName}" not found in plugin "${plugin.name}"`);
      }

      const result = await plugin.instance[methodName](...args);
      return result;
    } catch (error) {
      console.error(`Error running plugin method:`, error);
      toast.error(`Failed to run plugin method: ${error.message}`);
      throw error;
    }
  }

  async applyEffectPlugin(pluginId, targetId, options) {
    try {
      const plugin = this.effectPlugins.get(pluginId);
      if (!plugin) {
        throw new Error('Effect plugin not found');
      }

      const effect = await this.runPluginMethod(pluginId, 'createEffect', options);
      await applyEffect(targetId, effect);
      toast.success(`Effect "${plugin.name}" applied successfully`);
    } catch (error) {
      console.error('Error applying effect plugin:', error);
      toast.error(`Failed to apply effect: ${error.message}`);
    }
  }

  async applyFontPlugin(pluginId, targetId, options) {
    try {
      const plugin = this.fontPlugins.get(pluginId);
      if (!plugin) {
        throw new Error('Font plugin not found');
      }

      const font = await this.runPluginMethod(pluginId, 'createFont', options);
      await addFont(targetId, font);
      toast.success(`Font "${plugin.name}" applied successfully`);
    } catch (error) {
      console.error('Error applying font plugin:', error);
      toast.error(`Failed to apply font: ${error.message}`);
    }
  }

  getPluginDependencies(pluginId) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    return plugin.instance.getDependencies ? plugin.instance.getDependencies() : [];
  }

  async installPluginDependencies(pluginId) {
    try {
      const dependencies = this.getPluginDependencies(pluginId);
      for (const dependency of dependencies) {
        await this.fetchPluginFromRepository(dependency.repositoryUrl, dependency.id);
      }
      toast.success('Plugin dependencies installed successfully');
    } catch (error) {
      console.error('Error installing plugin dependencies:', error);
      toast.error(`Failed to install plugin dependencies: ${error.message}`);
    }
  }

  async uninstallPlugin(pluginId) {
    try {
      const plugin = this.getPluginById(pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      // Run uninstall method if available
      if (typeof plugin.instance.uninstall === 'function') {
        await plugin.instance.uninstall();
      }

      this.deletePlugin(pluginId);
      toast.success(`Plugin "${plugin.name}" uninstalled successfully`);
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
      toast.error(`Failed to uninstall plugin: ${error.message}`);
    }
  }

  getPluginSettings(pluginId) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    return plugin.instance.getSettings ? plugin.instance.getSettings() : null;
  }

  async updatePluginSettings(pluginId, settings) {
    try {
      const plugin = this.getPluginById(pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      if (typeof plugin.instance.updateSettings !== 'function') {
        throw new Error(`Plugin "${plugin.name}" does not support settings updates`);
      }

      await plugin.instance.updateSettings(settings);
      toast.success(`Settings for plugin "${plugin.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating plugin settings:', error);
      toast.error(`Failed to update plugin settings: ${error.message}`);
    }
  }

  async checkForUpdates() {
    try {
      const updates = [];
      for (const plugin of this.plugins.values()) {
        if (typeof plugin.instance.checkForUpdate === 'function') {
          const updateAvailable = await plugin.instance.checkForUpdate();
          if (updateAvailable) {
            updates.push(plugin);
          }
        }
      }

      if (updates.length > 0) {
        toast.info(`Updates available for ${updates.length} plugins`);
        return updates;
      } else {
        toast.success('All plugins are up to date');
        return [];
      }
    } catch (error) {
      console.error('Error checking for plugin updates:', error);
      toast.error(`Failed to check for plugin updates: ${error.message}`);
      return [];
    }
  }

  async updatePlugin(pluginId) {
    try {
      const plugin = this.getPluginById(pluginId);
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      if (typeof plugin.instance.update !== 'function') {
        throw new Error(`Plugin "${plugin.name}" does not support automatic updates`);
      }

      const updatedPluginData = await plugin.instance.update();
      await this.loadPlugin(updatedPluginData);
      this.savePluginsToStorage();
      toast.success(`Plugin "${plugin.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating plugin:', error);
      toast.error(`Failed to update plugin: ${error.message}`);
    }
  }

  getPluginUsage(pluginId) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    return plugin.instance.getUsageInstructions ? plugin.instance.getUsageInstructions() : null;
  }

  async validateAllPlugins() {
    const invalidPlugins = [];
    for (const plugin of this.plugins.values()) {
      const validationResult = validatePlugin(plugin);
      if (!validationResult.isValid) {
        invalidPlugins.push({ plugin, error: validationResult.error });
      }
    }

    if (invalidPlugins.length > 0) {
      console.warn('Invalid plugins found:', invalidPlugins);
      toast.warn(`${invalidPlugins.length} invalid plugins found. Check console for details.`);
    } else {
      toast.success('All plugins are valid');
    }

    return invalidPlugins;
  }

  getPluginPerformanceMetrics(pluginId) {
    const plugin = this.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    return plugin.instance.getPerformanceMetrics ? plugin.instance.getPerformanceMetrics() : null;
  }

  async optimizePlugin(pluginId) {
    try {
      const plugin = this
    } finally {
      toast.success(`Plugin "${plugin.name}" optimized successfully`);
    }}}
