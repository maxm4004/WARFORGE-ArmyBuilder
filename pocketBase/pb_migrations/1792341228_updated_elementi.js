/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4184254014")

  // add field
  collection.fields.addAt(8, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_4184254014")

  // remove field
  collection.fields.removeById("select3554702498")

  return app.save(collection)
})
