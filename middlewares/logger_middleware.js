import fs from "node:fs";

function logger(req, res, next) {
  const method = req.method;
  const url = req.url;
  const reqTime = new Date().toISOString();

  const data = `${method} | ${url} | ${reqTime}\n`;

  fs.appendFile("requests_logs.txt", data, "utf-8", (error) => {
    if (error) {
      console.error("Error while writing into the file:", error);
    }
    next(); 
  });
}

export default logger;
