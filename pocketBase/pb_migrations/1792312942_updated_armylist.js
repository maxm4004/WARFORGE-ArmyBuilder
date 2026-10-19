/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1744723817")

  // add field
  collection.fields.addAt(13, new Field({
    "help": "",
    "hidden": false,
    "id": "select3554702498",
    "maxSelect": 1,
    "name": "armamento",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "normale",
      "misto"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1744723817")

  // remove field
  collection.fields.removeById("select3554702498")

  return app.save(collection)
})
