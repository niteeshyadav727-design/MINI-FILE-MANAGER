const http = require("http");
const path = require("path");
const fs = require("fs");

const server = http.createServer((req, res) => {
   if (req.method === "GET" && req.url === "/index.html") {
      const filepath = path.join(__dirname, "public", "index.html");
      fs.readFile(filepath, "utf8", (err, data) => {
         if (err) {
            res.end("Something went wrong");
         }
         else {
            res.end(data);
         }
      })
   }
   if (req.method === "GET" && req.url === "/style.css") {
      const filePath = (__dirname, "public", "style.css");
      fs.readFile(filePath, "utf8", (err, data) => {
         if (err) {
            res.end("Something is wrong in reading style.css file");
         }
         else {
            res.setHeader("content-type", "text/css")
            res.end(data);
         }
      })
   }
   if (req.method === "GET" && req.url === "/data.js") {
      const filePath = (__dirname, "public", "data.js");
      fs.readFile(filePath, "utf8", (err, data) => {
         if (err) {
            res.end("Something is wrong in reading the app.js")
         }
         else {
            res.setHeader("content-type", "application/javascript")
            res.end(data)
         }
      })
   }

})

server.listen(3006, () => {
   console.log("Server is running at port 3006");
})