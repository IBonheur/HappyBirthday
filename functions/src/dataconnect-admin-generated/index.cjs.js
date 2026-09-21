const {validateAdminArgs} = require("firebase-admin/data-connect");

const connectorConfig = {
  connector: "happybirthay",
  serviceId: "happybirthday",
  location: "us-east4",
};
exports.connectorConfig = connectorConfig;

function getUserGardens(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetUserGardens", undefined, inputOpts);
}
exports.getUserGardens = getUserGardens;

function getGardenWishes(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetGardenWishes", inputVars, inputOpts);
}
exports.getGardenWishes = getGardenWishes;

function createWish(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("CreateWish", inputVars, inputOpts);
}
exports.createWish = createWish;

function createGarden(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("CreateGarden", inputVars, inputOpts);
}
exports.createGarden = createGarden;

