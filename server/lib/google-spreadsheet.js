const NodeSpreadsheet = Meteor.npmRequire('google-spreadsheet')

OpenSheet = function (sheetId, auth) {
  // Use user.services.google.accessToken
  const inst = new NodeSpreadsheet(sheetId)

  // Some methods return complex objects
  asyncMetaWrap(inst, 'getRows', ['save', 'del'])
  asyncMetaWrap(inst, 'getCells', ['save', 'del', 'setValue', 'getValueForSave'])
  const wrapped = Async.wrap(inst, ['useServiceAccountAuth', 'getRows', 'getInfo', 'getCells', 'bulkUpdateCells', 'addWorksheet' /*, 'deleteWorksheet' */ ])

  const creds = JSON.parse(Assets.getText("google-sheets-creds.json"))
  wrapped.useServiceAccountAuth(creds)
    //inst.setAuthToken(auth)

  // FIXME - wrap the worksheets array and the retuns of getRows
  return wrapped
}