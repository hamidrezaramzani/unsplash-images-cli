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

figlet("Hamidreza", async function(err, data) {
  if (err) {
    console.log("Something went wrong...");
    console.dir(err);
    return;
  }
  console.log(chalk.green(data));

  async function downloadImage() {
    if (!fs.existsSync("./photos")) {
      fs.mkdirSync("./photos");
    }

    const { name, quality, count } = await input.prompt(questions);
    spinner.start();
    const res = await axios.default.get(getUrl(name));

    if (!res.data.total) {
      throw new Error("image not found");
    }
    return Promise.all(
      res.data.results
        .splice(count)
        .map((img, index) =>
          download(img.urls[quality], getFileName(name, quality, index))
        )
    );
  }

  try {
    await downloadImage();
    clear();
    console.log(chalk.green("all images downloaded!"));
  } catch (error) {
    console.log(chalk.red(error));
  } finally {
    spinner.stop();
  }
});
