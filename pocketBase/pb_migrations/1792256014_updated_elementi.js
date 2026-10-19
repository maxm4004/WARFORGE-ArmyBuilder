/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4184254014")

  // remove field
  collection.fields.removeById("text1310703715")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4184254014")

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1310703715",
    "max": 0,
    "min": 0,
    "name": "ruolo",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
