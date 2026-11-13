/**
 * JSON Data Export & Serialization Service
 * Supports exporting individual models, public dataset bundle, private dataset bundle,
 * or full database snapshots directly from JSON data stores.
 */

import { BACKEND_MODELS } from '../models/modelRegistry';

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
