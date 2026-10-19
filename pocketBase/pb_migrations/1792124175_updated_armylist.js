/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1744723817")

  // add field
  collection.fields.addAt(12, new Field({
    "help": "",
    "hidden": false,
    "id": "select192162311",
    "maxSelect": 1,
    "name": "formazione",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "linea",
      "doppia_linea",
      "colonna"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1744723817")

  // remove field
  collection.fields.removeById("select192162311")

  return app.save(collection)
})
