const fs = require("fs");
const http = require("http");
const urlPkg = require("url");
const ytdl = require("ytdl-core");

http.createServer(runServer).listen(process.env.PORT || 8008);

async function runServer(req, res) {
    var url = urlPkg.parse(req.url, true);
    if (url.pathname == "/") {
        fs.readFile("./web-content/index.html", function (err, resp) { 
            if (!err) {
                res.writeHead(200, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "text/html"
                });
                res.end(resp);
            }
        })
    } else if (url.pathname.substring(0,4) !== "/api") {
        fs.readFile("./web-content" + url.pathname, function (err, resp) {
            if (!err) {
                var ft = url.pathname.split(".")[url.pathname.split.length];
                if (ft == "html") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "text/html"
                    });
                } else if (ft == "css") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "text/css"
                    })
                } else if (ft == "js") {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/javascript"
                    })
                } else {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*"
                    })
                }
                res.end(resp);
            } else {
                if (err.code == "ENOENT") {
                    fs.readFile("./error-pages/not-found.html", function (err, resp) {
                        res.writeHead(404, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "text/html"
                        });
                        res.end(resp)
                    })
                } else if (err.code == "EISDIR") {
                    if (fs.existsSync("./web-content" + url.pathname + "index.html")) {
                        fs.readFile("./web-content" + url.pathname + "index.html", function (err, resp) {
                            if (!err) {
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/html"
                                });
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.code);
                            }
                        })
                    } else if (fs.existsSync("./web-content" + url.pathname + "/index.html")) {
                        fs.readFile("./web-content" + url.pathname + "/index.html", function (err, resp) {
                            if (!err) {
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/html"
                                });
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin" : "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.code);
                            }
                        })
                    } else {
                        fs.readFile("./error-pages/not-found.html", function (err, resp) {
                            res.writeHead(404, {
                                "Access-Control-Allow-Origin" : "*",
                                "Content-Type": "text/html"
                            });
                            res.end(resp)
                        })
                    }
                }
            }
        })
    } else {
        if (url.pathname.substring(0,4) == "/api") {
            var path = [];
            for (var c in url.pathname.split("/api")[1].split("/")) {
                path.push(url.pathname.split("/api")[1].split("/")[c]);
            }
            var path = path.slice(1)
            if (path[0] == "" && !path[1]) {
                var data = JSON.stringify({
                    "version": "1.0.0"
                })
                res.writeHead(200, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "application/json"
                });
                res.end(data);
            } else if (path[0] == "validate") {
                if (url.query.id) {
                    var data = JSON.stringify({
                        "isValid": ytdl.validateID(url.query.id),
                        "type": "id"
                    })
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                } else if (url.query.url) {
                    if (ytdl.validateURL(url.query.url)) {var id = ytdl.getURLVideoID(url.query.url);} else {var id = null;}
                    var data = JSON.stringify({
                        "isValid": ytdl.validateURL(url.query.url),
                        "type": "url",
                        "id": id
                    });
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                } else {
                    var data = JSON.stringify({
                        "isValid": false,
                        "type": "none"
                    });
                    res.writeHead(400, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                }
            } else if (path[0] == "getQuality") {
                if (url.query.id) {
                    var i = await ytdl(url.query.id)
                    i.on("info", function(info) {
                        var b = JSON.stringify(info.formats);
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "application/json"
                        });
                        res.end(b);
                    })
                } else {
                    var data = [];
                    res.writeHead(400, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                }
            } else if (path[0] == "download") {
                if (url.query.id && url.query.itag) {
                    if (!fs.existsSync("./files/")) {fs.mkdirSync("./files/")}
                    fs.writeFileSync("./files/" + url.query.id + "-" + url.query.itag + ".mp4", "");
                    var a = ytdl(url.query.id, {quality: url.query.itag})
                    a.pipe(fs.createWriteStream("./files/" + url.query.id + "-" + url.query.itag + ".mp4")).on("close", function() {
                        var data = JSON.stringify({
                            "location": "/api/files/" + url.query.id + "-" + url.query.itag + ".mp4",
                            "success": true
                        });
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "application/json"
                        });
                        res.end(data);
                        setTimeout(function () {
                            if (fs.existsSync("./files/" + url.query.id + "-" + url.query.itag + ".mp4")) {
                                fs.unlinkSync("./files/" + url.query.id + "-" + url.query.itag + ".mp4");
                            }
                        }, 1800000)
                    });
                } else {
                    var data = {
                        "err": "missingInfo",
                        "success": false
                    };
                    res.writeHead(400, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "application/json"
                    });
                    res.end(data);
                }
            } else if (path[0] == "files") {
                if (fs.existsSync("./files/")) {
                    if (fs.existsSync("./files" + url.pathname.split("/files")[1])) {
                        var path = "./files" + url.pathname.split("/files")[1];
                        var fileName = url.pathname.split("/")[url.pathname.split("/").length - 1];
                        var readStream = fs.createReadStream(path);
                        var fileSize = fs.statSync(path)["size"];
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin":"*",
                            "Content-Type": "application/octet-stream",
                            "Content-Length": fileSize,
                            "Content-Disposition": "attachment; filename=" + fileName
                        })
                        readStream.pipe(res);
                    } else {
                        fs.readFile("./error-pages/not-found.html", function (err, resp) {
                            res.writeHead(404, {
                                "Access-Control-Allow-Origin" : "*",
                                "Content-Type": "text/html"
                            });
                            res.end(resp)
                        })
                    }
                } else {
                    fs.readFile("./error-pages/not-found.html", function (err, resp) {
                        res.writeHead(404, {
                            "Access-Control-Allow-Origin" : "*",
                            "Content-Type": "text/html"
                        });
                        res.end(resp)
                    })
                }
            } else {
                var data = JSON.stringify({
                    "version": "1.0.0",
                    "err": "couldNotFindEndpoint"
                })
                res.writeHead(400, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "application/json"
                });
                res.end(data);
            }
        }
    }
}