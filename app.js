//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Database connection
mongoose.connect('mongodb+srv://sujeetpawar17:<passward>@todolistdb.gjsqsjh.mongodb.net/todoList?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Creating the schema for items
const itemsSchema = new mongoose.Schema({
  name: String
});

// Mongoose model for items
const Item = mongoose.model('Item', itemsSchema);

// Default items
const defaultItems = [
  new Item({ name: "Welcome to your ToDolist" }),
  new Item({ name: "Hit + this to add new tasks" }),
  new Item({ name: "<----- Hit this to delete tasks" })
];

// Mongoose schema for lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// Mongoose model for lists
const List = mongoose.model("List", listSchema);

// Main route
app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred.");
  }
});

// Custom list route
app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({ name: customListName, items: defaultItems });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});

// Add item route
app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred.");
    }
  }
});

// Delete item route
app.post("/delete", async function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).send("An error occurred while deleting the item.");
    }
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).send("An error occurred while deleting the item.");
    }
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
