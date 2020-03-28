#!/usr/bin/env node
const chalk = require("chalk");
const axios = require("axios");
const http = require("https");
const figlet = require("figlet");
const input = require("inquirer");
const clear = require("clear");
const fs = require("fs");
const { client_key } = require("./config");
const Spinner = require("cli-spinner").Spinner;
var spinner = new Spinner(chalk.blue("Wait for download images... %s"));
spinner.setSpinnerString("\\|/");
clear();

const getFileName = (name, quality, index) =>
  "./photos/" + name + "-" + quality + "-" + index + ".png";
const download = function(uri, filename) {
  return new Promise((resolve, reject) => {
    http.get(uri, function(req) {
      req
        .pipe(fs.createWriteStream(filename))
        .on("close", resolve.bind(null, filename + " saved!"));
    });
  });
};

const getUrl = city =>
  `https://api.unsplash.com/search/photos?query=${city.trim()}&client_id=${client_key}`;

const questions = [
  {
    type: "input",
    name: "name",
    message: "Enter your picture name: ",
    validate: value => (value.length ? true : "can not be empty!")
  },
  {
    type: "input",
    name: "count",
    message: "How many pictures do you want? ",
    validate: value => {
      return !isNaN(Number(value)) && value > 0
        ? true
        : "must be integer and grater than 0!";
    }
  },
  {
    type: "rawlist",
    name: "quality",
    choices: ["raw", "full", "regular", "small", "thumb"],
    message: "Choose photo quality: "
  }
];

figlet("Hamidreza", function(err, data) {
  if (err) {
    console.log("Something went wrong...");
    console.dir(err);
    return;
  }
  console.log(chalk.green(data));
  (async function() {
    try {
      const { name, count, quality } = await input.prompt(questions);
      spinner.start();
      const imagesData = await axios.default.get(getUrl(name));
      if (imagesData.data.total > 0) {
        const items = imagesData.data.results.splice(0, count);
        const urls = [];
        !fs.existsSync("./photos") ? fs.mkdirSync("./photos") : null;
        items.forEach((img, index) => {
          urls.push(
            download.call(
              this,
              img.urls[quality],
              getFileName(name, quality, index + 1)
            )
          );
        });
        await Promise.all([...urls]);
        spinner.stop();
        clear();
        console.log(chalk.green("All Pictures Downloaded!"));
      } else {
        throw new Error("image not found!");
      }
    } catch (error) {
      spinner.stop();
      console.log("\n", chalk.redBright(error));
    }
  })();
});
