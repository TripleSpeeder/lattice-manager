import { constants } from './helpers';
class StorageSession {
  constructor(device_id, pass) {
    this.data = null;
    this.store = JSON.parse(window.localStorage.getItem(constants.ROOT_STORE) || '{}');
  }

  isObject(o) {
    try {
      return o && typeof o === 'object' && !Array.isArray(o);
    } catch(e) {
      return false;
    }
  }

  updateBranch(newData, oldData, key) {
    // If we have reached the end of oldData
    if (!this.isObject(oldData))
      return;

    // If `newData[key]` is a nested object, start that object
    // clone in `oldData`
    if (this.isObject(newData[key]) && !oldData[key])
      oldData[key] = {};

    // Loop through all keys in new data at this level. We will
    // be adding each one as a branch
    if (this.isObject(newData[key])) {
      Object.keys(newData[key]).forEach((newKey) => {
        // If there are more keys nested in this branch, update them first
        if (this.isObject(newData[key][newKey]))
          this.updateBranch(newData[key], oldData[key], newKey)
        // No more keys in this branch? Finally copy this data to `oldData`
        else
          oldData[key][newKey] = newData[key][newKey];
      });
    }
  }

  save(deviceID, wallet_uid, data) {
    // Get the data for this deviceID
    if (!this.store[deviceID]) this.store[deviceID] = {};
    if (!this.store[deviceID][wallet_uid]) this.store[deviceID][wallet_uid] = {};
    // Update relevant keys without overwriting anything else
    Object.keys(data).forEach((k) => {
      this.updateBranch(data, this.store[deviceID][wallet_uid], k);
    })
    // Update the store itself
    window.localStorage.setItem(constants.ROOT_STORE, JSON.stringify(this.store));
  }

  getWalletData(deviceID, wallet_uid) {
    if (!this.store[deviceID]) this.store[deviceID] = {};
    if (!this.store[deviceID][wallet_uid]) this.store[deviceID][wallet_uid] = {};
    return this.store[deviceID][wallet_uid];
  }
}


export default StorageSession;