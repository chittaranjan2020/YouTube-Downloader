function download() {
    document.getElementById("dl").classList.remove("invalid");
    document.getElementById("ldr").style.display = "";
    document.getElementById("qs").innerHTML = "";
    document.getElementById("downloadSnack").style.display = "none";
    document.getElementById("status").innerHTML = "Checking URL...";
    var input = document.getElementById("dl").value;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/validate?url=" + input);
    xhr.send();
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText);
        if (json.isValid == false && json.type == "none") {
            document.getElementById("dl").classList.add("invalid");
            document.getElementById("ldr").style.display = "none";
            document.getElementById("downloadSnack").style.display = "";
            return;
        }
        if (json.isValid == true) {
            createRequest(json.id);
        } else {
            xhr.open("GET", "/api/validate?id=" + input);
            xhr.send();
            xhr.onload = function () {
                var json = JSON.parse(xhr.responseText);
                if (json.isValid == true) {
                    createRequest(input);
                } else {
                    document.getElementById("dl").classList.add("invalid");
                    document.getElementById("ldr").style.display = "none";
                    document.getElementById("downloadSnack").style.display = "";
                }
            }
        }
    }
}

function createRequest(i) {
    document.getElementById("status").innerHTML = "Generating request...";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/getQuality?id=" + i);
    xhr.send();
    xhr.onload = function () {
        window.id = i;
        document.getElementById("status").innerHTML = "Parsing response...";
        var json = JSON.parse(xhr.responseText);
        console.log(json)
        document.getElementById("status").innerHTML = "Creating elements...";
        for (var c in json) {
            var div = document.createElement("div");
            div.classList.add("qualityChip");
            div.id = json[c].itag;
            div.onclick = function () {openItag(window.id, this.id)}
            if (json[c].hasAudio == true && json[c].hasVideo == true) {
                document.getElementById("qs").appendChild(div);
            }
        }
        document.getElementById("status").innerHTML = "Awaiting response...";
    }
}

function openItag(id, itag) {
    var xhr = new XMLHttpRequest();
    document.getElementById("qs").style.display = "none";
    document.getElementById("status").innerHTML = "Downloading to our servers...";
    document.getElementById("statDeet").innerHTML = "This may take a minute.";
    xhr.open("GET", "/api/download?id=" + id + "&itag=" + itag);
    xhr.send();
    xhr.onload = function () {
        document.getElementById("ldr").style.display = "none";
        document.getElementById("complete").style.display = "";
        var json = JSON.parse(xhr.responseText);
        document.getElementById("downloadLink").href = json.location;
    }
}