function filmExtractor() {
    var scripts = document.querySelectorAll("script");
    var jsonResult = "{}";
    for (let i = 0; i < scripts.length; i++) {
        let value = scripts[i];
        var indexStart = value.innerHTML.search("window.__player__");
        if (indexStart > -1) {
            var subString = value.innerHTML.substr(indexStart);
            jsonResult = subString.replace(new RegExp("(window.__player__)(.*)(\{.*?})(.*)", 'gs'), "$3");
            break;
        }
    }
    jsonResult = jsonResult.replaceAll(new RegExp("( )(\\w+)(:)", 'gis'), "\"$2\"$3");
    jsonResult = jsonResult.replaceAll(new RegExp("'", 'gis'), "\"");
    return JSON.parse(jsonResult);
}

function serialInfoExtractor() {
    var scripts = document.querySelectorAll("script");
    var jsonResult = "{}";
    for (let i = 0; i < scripts.length; i++) {
        let value = scripts[i];
        var serialInfoIndexStart = value.innerHTML.search("var serialInfo");
        if (serialInfoIndexStart > -1) {
            var subString = value.innerHTML.substr(serialInfoIndexStart);
            jsonResult = subString.replace(new RegExp("(.*)(var serialInfo)(.*?)(\{.*\})(;.*)", 'gs'), "$4");
            break;
        }
    }
    return JSON.parse(jsonResult);
}

function downloadButton(id, url) {
    var styles = `
    .download {
        margin-left: 10px
    }
    `
    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    return `
    <div class="download` + id + `">
       <span class="movies-button movies-button_bg-gray movies-button_pt-0_pb_0">
         <span class="movies-button-inset movies-button_h40">
             <span class="puzzle_va_middle puzzle_ml_10"><a href= "` + url + `" download>Download</a></span>
         </span>
       </span>
    </div>`;
}

if (document.URL.startsWith("https://puzzle-movies.com/films")) {
    console.log("film started");
    const jsonFilm = filmExtractor();
    const element = document.querySelector(".series-films__info-user-elem.js-series-films-info-user-elem");
    if (element != null && element.querySelector(".download") == null) {
        element.innerHTML += downloadButton("", jsonFilm.url);
    }
    console.log("film finished");
} else if (document.URL.match("(.*?)(s\\d+e\\d+)(.*)")) {

    var serialJsonInfo = serialInfoExtractor();

    var season = document.URL.replace(new RegExp("(.*?)(s)(\\d+)(e)(\\d+)(.*)", 'gs'), "$3");
    var episode = document.URL.replace(new RegExp("(.*?)(s)(\\d+)(e)(\\d+)(.*)", 'gs'), "$5") - 1;

    const elements = document.querySelectorAll(".series-light__table-row");
    if (elements != null && elements[episode].querySelector(".downloads" + season + "e" + episode) == null) {
        fetch("api2/movies/getEpisodeData?movieID=" +
            serialJsonInfo.movie_id + "&slug=" + serialJsonInfo.slug + "&postID=" + serialJsonInfo.seasons[season].episodes[episode].ID)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                elements[episode].innerHTML += downloadButton("s" + season + "e" + episode, data.videoURL);
            }).catch(reason => console.error(reason));
    }
}