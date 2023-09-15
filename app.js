//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
//const _ = require("lodash");

//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//atlas mongodb connection aws cloud 
mongoose.connect("mongodb+srv://aseel:u09ZrIMRIFjq3ej9@cluster0.ekukhrk.mongodb.net/todolistDB", {useNewUrlParser: true});

//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//Created model
const Item = mongoose.model("Item", itemsSchema);
 
//Creating items
const item1 = new Item({
  name: "Welcome to your To-Do list."
});
 
const item2 = new Item({
  name: "Hit + button to create a new item."
});
 
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//new schema for customerList route
const listSchema = {
  name:String,
  items:[itemsSchema]
};
//Storing items into an array
const defaultItems = [item1, item2, item3];

//mongoose model for listSchema
const List = mongoose.model("List", listSchema);


//In latest version of mongoose insertMany has stopped accepting callbacks
//instead they use promises(Which Angela has not taught in this course)
//So ".then" & "catch" are part of PROMISES IN JAVASCRIPT.
 
//PROMISES in brief(If something is wrong please correct me):
//In JS, programmers encountered a problem called "callback hell", where syntax of callbacks were cumbersome & often lead to more problems.
//So in effort to make it easy PROMISES were invented.
//to learn more about promise visit : https://javascript.info/promise-basics
//Or https://www.youtube.com/watch?v=novBIqZh4Bk

 
app.get("/", function(req, res) {
  //printing all store values in terminal (In my case Hyper Terminal)
  Item.find({})
    .then(foundItem => {
      //check if there is items and if not its going to add 3 items
      if (foundItem.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return foundItem;
      }
    })
    .then(savedItem => {
      res.render("list", {
        listTitle: "Today",
        newListItems: savedItem
      });
    })
    .catch(err => console.log(err));
 
});
 

app.get("/:customListName",function(req,res){
  const customListName = req.params.customListName; //_.capitalize(req.params.customListName);
  List.findOne({name: customListName})
    .then(foundList => {
      if(!foundList){
 
        const list = new List({
          name: customListName,
          items: defaultItems
        });
 
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch((err) => {
      console.log(err);
    });
 
 
});
  // List.findOne({ name: customListName })
  //           .then((result) => {
  //               if (result != null) {
  //                   console.log("match found ✅", result);
  //               } else {
  //                   console.log("Not found ❌");
  //               }
  //           })
  //           .catch((error) => {
  //               console.log("ERROR: ❌", error);
  //           });
  //         });
 

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
 
 
  //create new item doc
  const item = new Item({
    name: itemName
  });
  // If the list name is "Today", add the new item to the database and redirect to the home page.
  // Otherwise, find the corresponding list in the database and add the new item to it.
  if (listName === "Today") {
    try {
      await item.save();
      console.log("New item has been added to the database: " + itemName);
      res.redirect("/");
    } catch (error) {
      console.log("Error fail adding new item to database: ", error);
    }
  } else {
    const foundList = await List.findOne({ name: listName });
    if (!foundList) {
      console.log(`List ${listName} not found.`);
      console.log("the list name is: " + listName);
    }
    try {
      foundList.items.push(item);
      await foundList.save();
      console.log("New item has been added to the database: " + itemName);
      res.redirect("/" + listName);
    } catch (error) {
      console.log("Error fail adding new item to database: ", error);
    }
  }
});


// The request body contains the ID of the item to be deleted from a list.
app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
 
  // Print the name of the list to the console for debugging purposes.
  console.log("the list name is: " + listName);
 
  // If the list name is "Today", remove the item from the database and redirect to the home page.
  // Otherwise, find the corresponding list in the database and remove the item from it.
  if (listName === "Today") {
    if (checkedItemId != undefined) {
      await Item.findByIdAndRemove(checkedItemId);
      console.log(`Deleted ${checkedItemId} Successfully`);
      res.redirect("/");
    }
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    console.log(`Deleted ${checkedItemId} Successfully`);
    res.redirect("/" + listName);
  }
});
 
app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
