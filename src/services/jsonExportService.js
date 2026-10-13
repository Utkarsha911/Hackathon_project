/**
 * JSON Data Export & Serialization Service
 * Supports exporting individual models, public dataset bundle, private dataset bundle,
 * or full database snapshots directly from JSON data stores.
 */

import { MODEL_VISIBILITY, BACKEND_MODELS } from '../models/modelRegistry';

/**
 * Triggers a browser download of a JSON object or array as a .json file
 * @param {string} filename - e.g. 'hackathon_prizes_export.json'
 * @param {object|array} data - The JSON data to download
 */
export function downloadJsonFile(filename, data) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Copies formatted JSON string to user's clipboard
 * @param {object|array} data
 * @returns {Promise<boolean>}
 */
export async function copyJsonToClipboard(data) {
  try {
    const formatted = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(formatted);
    return true;
  } catch (err) {
    console.error('Failed to copy JSON to clipboard:', err);
    return false;
  }
}

/**
 * Formats a model dataset into an official JSON export bundle with metadata
 */
export function createModelExportPackage(modelName, records) {
  const modelMeta = BACKEND_MODELS[modelName] || {
    name: modelName,
    visibility: 'custom',
    tableName: modelName.toLowerCase(),
    description: 'Custom dataset'
  };

  return {
    _export_metadata: {
      exported_at: new Date().toISOString(),
      platform: 'BIC Hackathon System',
      backend_origin: 'bic_hackathon_design',
      model_name: modelName,
      table_name: modelMeta.tableName,
      visibility_scope: modelMeta.visibility,
      total_records: Array.isArray(records) ? records.length : 1,
      schema_source: modelMeta.sourceFile || 'backend'
    },
    schema_fields: modelMeta.fields || [],
    data: records
  };
}

/**
 * Bundle multiple models based on scope ('normal' | 'private' | 'all')
 */
export function bundleDatasetsByScope(allDataStore, scope = 'all') {
  const result = {
    _export_metadata: {
      exported_at: new Date().toISOString(),
      platform: 'BIC Hackathon System',
      backend_origin: 'bic_hackathon_design',
      scope,
      generated_by: 'BIC Unified Data Service'
    },
    models: {}
  };

  Object.entries(BACKEND_MODELS).forEach(([modelKey, meta]) => {
    if (scope === 'all' || meta.visibility === scope) {
      if (allDataStore[modelKey] !== undefined) {
        result.models[modelKey] = {
          visibility: meta.visibility,
          tableName: meta.tableName,
          count: Array.isArray(allDataStore[modelKey]) ? allDataStore[modelKey].length : 1,
          data: allDataStore[modelKey]
        };
      }
    }
  });

  return result;
}
